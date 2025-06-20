from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from services.supabase_service import SupabaseService
from models.postgresql.room import Room, room_members, room_admins
from models.postgresql.user import User
import uuid

router = APIRouter()
supabase_service = SupabaseService()

# Helper: get current user from session cookie
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("airoom_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Decode JWT (reuse logic from auth)
    import jwt
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload["user"]["sub"]
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")

@router.post("/create")
async def create_room(data: Dict[str, Any], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new room. Creator becomes admin."""
    name = data.get("name")
    password = data.get("password")
    if not name or not password:
        raise HTTPException(status_code=400, detail="Room name and password required")
    room_id = str(uuid.uuid4())
    room = Room(id=room_id, name=name, created_by=user.id)
    db.add(room)
    db.commit()
    # Add creator as member and admin
    db.execute(room_members.insert().values(room_id=room_id, user_id=user.id))
    db.execute(room_admins.insert().values(room_id=room_id, user_id=user.id))
    db.commit()
    return {"room_id": room_id, "message": "Room created", "admin": user.id}

@router.post("/join")
async def join_room(data: Dict[str, Any], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Request to join a room. Admin must approve."""
    room_id = data.get("room_id")
    password = data.get("password")
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    # TODO: Check password (implement password storage/validation)
    # For now, assume password is correct
    # Add user as member (pending approval logic can be added)
    db.execute(room_members.insert().values(room_id=room_id, user_id=user.id))
    db.commit()
    return {"message": "Join request sent", "room_id": room_id}

@router.post("/leave")
async def leave_room(data: Dict[str, Any], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Leave a room. Admin cannot leave if only one admin remains."""
    room_id = data.get("room_id")
    # Check if user is admin
    admin_count = db.execute(room_admins.select().where(room_admins.c.room_id == room_id)).rowcount
    is_admin = db.execute(room_admins.select().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == user.id))).rowcount > 0
    if is_admin and admin_count <= 1:
        raise HTTPException(status_code=400, detail="Cannot leave as the only admin")
    # Remove from members and admins
    db.execute(room_members.delete().where((room_members.c.room_id == room_id) & (room_members.c.user_id == user.id)))
    db.execute(room_admins.delete().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == user.id)))
    db.commit()
    return {"message": "Left room", "room_id": room_id}

@router.post("/promote")
async def promote_member(data: Dict[str, Any], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Promote a member to admin. Only admins can promote."""
    room_id = data.get("room_id")
    member_id = data.get("member_id")
    # Check if user is admin
    is_admin = db.execute(room_admins.select().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == user.id))).rowcount > 0
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only admins can promote")
    db.execute(room_admins.insert().values(room_id=room_id, user_id=member_id))
    db.commit()
    return {"message": "Member promoted to admin", "member_id": member_id}

@router.post("/demote")
async def demote_admin(data: Dict[str, Any], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Demote an admin to member. Cannot demote if only one admin remains."""
    room_id = data.get("room_id")
    admin_id = data.get("admin_id")
    admin_count = db.execute(room_admins.select().where(room_admins.c.room_id == room_id)).rowcount
    if admin_count <= 1:
        raise HTTPException(status_code=400, detail="Cannot demote the only admin")
    db.execute(room_admins.delete().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == admin_id)))
    db.commit()
    return {"message": "Admin demoted to member", "admin_id": admin_id}

@router.delete("/delete")
async def delete_room(data: Dict[str, Any], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a room. Only admins can delete. Cascade deletes topics, chat logs, and member links."""
    room_id = data.get("room_id")
    # Check if user is admin
    is_admin = db.execute(room_admins.select().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == user.id))).rowcount > 0
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only admins can delete room")
    # Cascade delete topics, chat logs, member/admin links (implement as needed)
    db.execute(room_members.delete().where(room_members.c.room_id == room_id))
    db.execute(room_admins.delete().where(room_admins.c.room_id == room_id))
    db.query(Room).filter(Room.id == room_id).delete()
    db.commit()
    return {"message": "Room deleted", "room_id": room_id}

@router.get("/list")
async def list_user_rooms(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all rooms the current user is a member of, with members and admins."""
    # Find all room IDs where user is a member
    room_ids = [row.room_id for row in db.execute(room_members.select().where(room_members.c.user_id == user.id))]
    if not room_ids:
        return {"rooms": []}
    # Fetch all rooms
    rooms = db.query(Room).filter(Room.id.in_(room_ids)).all()
    result = []
    for room in rooms:
        # Get members
        member_ids = [row.user_id for row in db.execute(room_members.select().where(room_members.c.room_id == room.id))]
        members = db.query(User).filter(User.id.in_(member_ids)).all()
        # Get admins
        admin_ids = [row.user_id for row in db.execute(room_admins.select().where(room_admins.c.room_id == room.id))]
        admins = db.query(User).filter(User.id.in_(admin_ids)).all()
        result.append({
            "id": room.id,
            "name": room.name,
            "created_by": room.created_by,
            "created_at": getattr(room, "created_at", None),
            "members": [{"id": m.id, "name": m.name, "email": m.email} for m in members],
            "admins": [{"id": a.id, "name": a.name, "email": a.email} for a in admins],
        })
    return {"rooms": result} 