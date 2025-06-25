from fastapi import APIRouter, HTTPException, Depends, Request, status
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from services.supabase_service import SupabaseService
from models.postgresql.room import Room, room_members, room_admins
from models.postgresql.user import User as PGUser
import uuid
from fastapi.responses import JSONResponse
from middleware.auth_middleware import get_current_user

router = APIRouter()
supabase_service = SupabaseService()

try:
    import jwt
except ImportError:
    # jwt is required for authentication. Please install with 'pip install PyJWT'
    jwt = None

@router.post("/create")
async def create_room(data: Dict[str, Any], user: PGUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        name = data.get("name")
        password = data.get("password")
        if not name or not password:
            raise HTTPException(status_code=400, detail="Room name and password required")
        room_id = str(uuid.uuid4())
        room = Room(id=room_id, name=name, created_by=user.id)
        db.add(room)
        db.commit()
        db.execute(room_members.insert().values(room_id=room_id, user_id=user.id))
        db.execute(room_admins.insert().values(room_id=room_id, user_id=user.id))
        db.commit()
        return {"room_id": room_id, "message": "Room created", "admin": user.id}
    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Failed to create room: {str(e)}"})

@router.post("/join")
async def join_room(data: Dict[str, Any], user: PGUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        room_id = data.get("room_id")
        password = data.get("password")
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        db.execute(room_members.insert().values(room_id=room_id, user_id=user.id))
        db.commit()
        return {"message": "Join request sent", "room_id": room_id}
    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Failed to join room: {str(e)}"})

@router.post("/leave")
async def leave_room(data: Dict[str, Any], user: PGUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        room_id = data.get("room_id")
        admin_count = db.execute(room_admins.select().where(room_admins.c.room_id == room_id)).rowcount
        is_admin = db.execute(room_admins.select().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == user.id))).rowcount > 0
        if is_admin and admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot leave as the only admin")
        db.execute(room_members.delete().where((room_members.c.room_id == room_id) & (room_members.c.user_id == user.id)))
        db.execute(room_admins.delete().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == user.id)))
        db.commit()
        return {"message": "Left room", "room_id": room_id}
    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Failed to leave room: {str(e)}"})

@router.post("/promote")
async def promote_member(data: Dict[str, Any], user: PGUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        room_id = data.get("room_id")
        member_id = data.get("member_id")
        is_admin = db.execute(room_admins.select().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == user.id))).rowcount > 0
        if not is_admin:
            raise HTTPException(status_code=403, detail="Only admins can promote")
        db.execute(room_admins.insert().values(room_id=room_id, user_id=member_id))
        db.commit()
        return {"message": "Member promoted to admin", "member_id": member_id}
    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Failed to promote member: {str(e)}"})

@router.post("/demote")
async def demote_admin(data: Dict[str, Any], user: PGUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        room_id = data.get("room_id")
        admin_id = data.get("admin_id")
        admin_count = db.execute(room_admins.select().where(room_admins.c.room_id == room_id)).rowcount
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the only admin")
        db.execute(room_admins.delete().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == admin_id)))
        db.commit()
        return {"message": "Admin demoted to member", "admin_id": admin_id}
    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Failed to demote admin: {str(e)}"})

@router.delete("/delete")
async def delete_room(data: Dict[str, Any], user: PGUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        room_id = data.get("room_id")
        is_admin = db.execute(room_admins.select().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == user.id))).rowcount > 0
        if not is_admin:
            raise HTTPException(status_code=403, detail="Only admins can delete room")
        db.execute(room_members.delete().where(room_members.c.room_id == room_id))
        db.execute(room_admins.delete().where(room_admins.c.room_id == room_id))
        db.query(Room).filter(Room.id == room_id).delete()
        db.commit()
        return {"message": "Room deleted", "room_id": room_id}
    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Failed to delete room: {str(e)}"})

@router.get("/list")
async def list_user_rooms(user: PGUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        room_ids = [row.room_id for row in db.execute(room_members.select().where(room_members.c.user_id == user.id))]
        if not room_ids:
            return {"rooms": []}
        rooms = db.query(Room).filter(Room.id.in_(room_ids)).all()
        result = []
        for room in rooms:
            member_ids = [row.user_id for row in db.execute(room_members.select().where(room_members.c.room_id == room.id))]
            members = db.query(PGUser).filter(PGUser.id.in_(member_ids)).all()
            admin_ids = [row.user_id for row in db.execute(room_admins.select().where(room_admins.c.room_id == room.id))]
            admins = db.query(PGUser).filter(PGUser.id.in_(admin_ids)).all()
            result.append({
                "id": room.id,
                "name": room.name,
                "created_by": room.created_by,
                "created_at": getattr(room, "created_at", None),
                "members": [{"id": m.id, "name": m.name, "email": m.email} for m in members],
                "admins": [{"id": a.id, "name": a.name, "email": a.email} for a in admins],
            })
        return {"rooms": result}
    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(status_code=500, content={"rooms": [], "detail": f"Failed to list rooms: {str(e)}"})

@router.post("/make-admin")
async def make_admin(data: Dict[str, Any], user: PGUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Make a user an admin of a room"""
    try:
        room_id = data.get("room_id")
        user_email = data.get("user_email")
        
        if not room_id or not user_email:
            raise HTTPException(status_code=400, detail="Room ID and user email required")
        
        # Check if current user is admin
        is_admin = db.execute(room_admins.select().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == user.id))).rowcount > 0
        if not is_admin:
            raise HTTPException(status_code=403, detail="Only admins can promote users")
        
        # Find the user to promote
        user_to_promote = db.query(PGUser).filter(PGUser.email == user_email).first()
        if not user_to_promote:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user is already an admin
        is_already_admin = db.execute(room_admins.select().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == user_to_promote.id))).rowcount > 0
        if is_already_admin:
            raise HTTPException(status_code=400, detail="User is already an admin")
        
        # Add user to admins
        db.execute(room_admins.insert().values(room_id=room_id, user_id=user_to_promote.id))
        db.commit()
        
        return {"message": "User promoted to admin", "user_email": user_email}
    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Failed to promote user: {str(e)}"})

@router.delete("/remove-user")
async def remove_user(data: Dict[str, Any], user: PGUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove a user from a room"""
    try:
        room_id = data.get("room_id")
        user_email = data.get("user_email")
        
        if not room_id or not user_email:
            raise HTTPException(status_code=400, detail="Room ID and user email required")
        
        # Check if current user is admin
        is_admin = db.execute(room_admins.select().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == user.id))).rowcount > 0
        if not is_admin:
            raise HTTPException(status_code=403, detail="Only admins can remove users")
        
        # Find the user to remove
        user_to_remove = db.query(PGUser).filter(PGUser.email == user_email).first()
        if not user_to_remove:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user is trying to remove themselves
        if user_to_remove.id == user.id:
            raise HTTPException(status_code=400, detail="You cannot remove yourself")
        
        # Check if user is the only admin
        admin_count = db.execute(room_admins.select().where(room_admins.c.room_id == room_id)).rowcount
        is_user_admin = db.execute(room_admins.select().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == user_to_remove.id))).rowcount > 0
        if is_user_admin and admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the only admin")
        
        # Remove user from both members and admins
        db.execute(room_members.delete().where((room_members.c.room_id == room_id) & (room_members.c.user_id == user_to_remove.id)))
        db.execute(room_admins.delete().where((room_admins.c.room_id == room_id) & (room_admins.c.user_id == user_to_remove.id)))
        db.commit()
        
        return {"message": "User removed from room", "user_email": user_email}
    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Failed to remove user: {str(e)}"})

@router.api_route('/{full_path:path}', methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def catch_all_room(full_path: str, request: Request):
    return JSONResponse(status_code=status.HTTP_405_METHOD_NOT_ALLOWED, content={"detail": "Method not allowed", "path": f"/api/room/{full_path}"}) 