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
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
supabase_service = SupabaseService()

try:
    import jwt
except ImportError:
    # jwt is required for authentication. Please install with 'pip install PyJWT'
    jwt = None

@router.post("/create")
async def create_room(
    data: Dict[str, Any], 
    user: PGUser = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Create a new room with auto-generated 8-digit room ID and password"""
    try:
        name = data.get("name")
        description = data.get("description", "")
        
        if not name:
            raise HTTPException(status_code=400, detail="Room name is required")
        
        # Create room with auto-generated room_id and room_password
        room = Room.create_room(
            name=name,
            description=description,
            created_by=user.id,
            db=db
        )
        
        # Add creator as member and admin
        db.execute(room_members.insert().values(room_id=room.id, user_id=user.id))
        db.execute(room_admins.insert().values(room_id=room.id, user_id=user.id))
        db.add(room)
        db.commit()
        db.refresh(room)
        
        return {
            "message": "Room created successfully",
            "room": {
                "id": room.id,
                "room_id": room.room_id,
                "room_password": room.room_password,
                "name": room.name,
                "description": room.description,
                "created_by": room.created_by,
                "created_at": room.created_at.isoformat() if room.created_at else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create room: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create room: {str(e)}")

@router.post("/join")
async def join_room(
    data: Dict[str, Any], 
    user: PGUser = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Join a room using room_id and room_password"""
    try:
        room_id = data.get("room_id")
        room_password = data.get("room_password")
        
        if not room_id or not room_password:
            raise HTTPException(status_code=400, detail="Room ID and password are required")
        
        # Find room by room_id
        room = db.query(Room).filter(Room.room_id == room_id).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Check password
        if room.room_password != room_password:
            raise HTTPException(status_code=400, detail="Invalid room password")
        
        # Check if user is already a member
        existing_member = db.execute(
            room_members.select().where(
                (room_members.c.room_id == room.id) & 
                (room_members.c.user_id == user.id)
            )
        ).first()
        
        if existing_member:
            raise HTTPException(status_code=400, detail="You are already a member of this room")
        
        # Check if room is full
        member_count = db.execute(
            room_members.select().where(room_members.c.room_id == room.id)
        ).rowcount
        
        if member_count >= room.max_members:
            raise HTTPException(status_code=400, detail="Room is full")
        
        # Add user as member
        db.execute(room_members.insert().values(room_id=room.id, user_id=user.id))
        db.commit()
        
        return {
            "message": "Successfully joined room",
            "room": {
                "id": room.id,
                "room_id": room.room_id,
                "name": room.name,
                "description": room.description
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to join room: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to join room: {str(e)}")

@router.post("/leave")
async def leave_room(
    data: Dict[str, Any], 
    user: PGUser = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Leave a room"""
    try:
        room_id = data.get("room_id")
        
        if not room_id:
            raise HTTPException(status_code=400, detail="Room ID is required")
        
        # Find room
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Check if user is a member
        is_member = db.execute(
            room_members.select().where(
                (room_members.c.room_id == room_id) & 
                (room_members.c.user_id == user.id)
            )
        ).first()
        
        if not is_member:
            raise HTTPException(status_code=400, detail="You are not a member of this room")
        
        # Check if user is admin
        is_admin = db.execute(
            room_admins.select().where(
                (room_admins.c.room_id == room_id) & 
                (room_admins.c.user_id == user.id)
            )
        ).first()
        
        # If user is admin, check if they can leave
        if is_admin:
            admin_count = db.execute(
                room_admins.select().where(room_admins.c.room_id == room_id)
            ).rowcount
            
            if admin_count <= 1:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot leave as the only admin. Please promote another member to admin first."
                )
        
        # Remove user from room
        db.execute(
            room_members.delete().where(
                (room_members.c.room_id == room_id) & 
                (room_members.c.user_id == user.id)
            )
        )
        
        # Remove admin privileges if applicable
        if is_admin:
            db.execute(
                room_admins.delete().where(
                    (room_admins.c.room_id == room_id) & 
                    (room_admins.c.user_id == user.id)
                )
            )
        
        db.commit()
        
        return {
            "message": "Successfully left room",
            "room_id": room_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to leave room: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to leave room: {str(e)}")

@router.post("/make-admin")
async def make_admin(
    data: Dict[str, Any], 
    user: PGUser = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Make a member an admin of the room"""
    try:
        room_id = data.get("room_id")
        member_email = data.get("member_email")
        
        if not room_id or not member_email:
            raise HTTPException(status_code=400, detail="Room ID and member email are required")
        
        # Check if current user is admin
        is_admin = db.execute(
            room_admins.select().where(
                (room_admins.c.room_id == room_id) & 
                (room_admins.c.user_id == user.id)
            )
        ).first()
        
        if not is_admin:
            raise HTTPException(status_code=403, detail="Only admins can promote members")
        
        # Find the member to promote
        member = db.query(PGUser).filter(PGUser.email == member_email).first()
        if not member:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user is a member of the room
        is_member = db.execute(
            room_members.select().where(
                (room_members.c.room_id == room_id) & 
                (room_members.c.user_id == member.id)
            )
        ).first()
        
        if not is_member:
            raise HTTPException(status_code=400, detail="User is not a member of this room")
        
        # Check if user is already an admin
        is_already_admin = db.execute(
            room_admins.select().where(
                (room_admins.c.room_id == room_id) & 
                (room_admins.c.user_id == member.id)
            )
        ).first()
        
        if is_already_admin:
            raise HTTPException(status_code=400, detail="User is already an admin")
        
        # Promote to admin
        db.execute(room_admins.insert().values(room_id=room_id, user_id=member.id))
        db.commit()
        
        return {
            "message": "User promoted to admin successfully",
            "member": member.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to promote user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to promote user: {str(e)}")

@router.post("/remove-admin")
async def remove_admin(
    data: Dict[str, Any], 
    user: PGUser = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Remove admin privileges from a user"""
    try:
        room_id = data.get("room_id")
        admin_email = data.get("admin_email")
        
        if not room_id or not admin_email:
            raise HTTPException(status_code=400, detail="Room ID and admin email are required")
        
        # Check if current user is admin
        is_admin = db.execute(
            room_admins.select().where(
                (room_admins.c.room_id == room_id) & 
                (room_admins.c.user_id == user.id)
            )
        ).first()
        
        if not is_admin:
            raise HTTPException(status_code=403, detail="Only admins can demote other admins")
        
        # Find the admin to demote
        admin_user = db.query(PGUser).filter(PGUser.email == admin_email).first()
        if not admin_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user is an admin of the room
        is_room_admin = db.execute(
            room_admins.select().where(
                (room_admins.c.room_id == room_id) & 
                (room_admins.c.user_id == admin_user.id)
            )
        ).first()
        
        if not is_room_admin:
            raise HTTPException(status_code=400, detail="User is not an admin of this room")
        
        # Check if this would leave the room without admins
        admin_count = db.execute(
            room_admins.select().where(room_admins.c.room_id == room_id)
        ).rowcount
        
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the only admin")
        
        # Demote admin
        db.execute(
            room_admins.delete().where(
                (room_admins.c.room_id == room_id) & 
                (room_admins.c.user_id == admin_user.id)
            )
        )
        db.commit()
        
        return {
            "message": "Admin privileges removed successfully",
            "user": admin_user.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to demote admin: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to demote admin: {str(e)}")

@router.delete("/delete")
async def delete_room(
    data: Dict[str, Any], 
    user: PGUser = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Delete a room (admin only)"""
    try:
        room_id = data.get("room_id")
        
        if not room_id:
            raise HTTPException(status_code=400, detail="Room ID is required")
        
        # Check if current user is admin
        is_admin = db.execute(
            room_admins.select().where(
                (room_admins.c.room_id == room_id) & 
                (room_admins.c.user_id == user.id)
            )
        ).first()
        
        if not is_admin:
            raise HTTPException(status_code=403, detail="Only admins can delete rooms")
        
        # Delete room and all associated data
        db.execute(room_members.delete().where(room_members.c.room_id == room_id))
        db.execute(room_admins.delete().where(room_admins.c.room_id == room_id))
        db.query(Room).filter(Room.id == room_id).delete()
        db.commit()
        
        return {
            "message": "Room deleted successfully",
            "room_id": room_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete room: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete room: {str(e)}")

@router.get("/list")
async def list_user_rooms(user: PGUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all rooms the user is a member of"""
    try:
        # Get room IDs where user is a member
        member_rooms = db.execute(
            room_members.select().where(room_members.c.user_id == user.id)
        ).fetchall()
        
        if not member_rooms:
            return {"rooms": []}
        
        room_ids = [row.room_id for row in member_rooms]
        rooms = db.query(Room).filter(Room.id.in_(room_ids)).all()
        
        result = []
        for room in rooms:
            # Get members
            member_ids = db.execute(
                room_members.select().where(room_members.c.room_id == room.id)
            ).fetchall()
            members = db.query(PGUser).filter(
                PGUser.id.in_([row.user_id for row in member_ids])
            ).all()
            
            # Get admins
            admin_ids = db.execute(
                room_admins.select().where(room_admins.c.room_id == room.id)
            ).fetchall()
            admins = db.query(PGUser).filter(
                PGUser.id.in_([row.user_id for row in admin_ids])
            ).all()
            
            # Check if current user is admin
            is_current_user_admin = db.execute(
                room_admins.select().where(
                    (room_admins.c.room_id == room.id) & 
                    (room_admins.c.user_id == user.id)
                )
            ).first() is not None
            
            result.append({
                "id": room.id,
                "room_id": room.room_id,
                "name": room.name,
                "description": room.description,
                "created_by": room.created_by,
                "created_at": room.created_at.isoformat() if room.created_at else None,
                "members": [member.to_dict() for member in members],
                "admins": [admin.to_dict() for admin in admins],
                "member_count": len(members),
                "admin_count": len(admins),
                "is_admin": is_current_user_admin
            })
        
        return {"rooms": result}
        
    except Exception as e:
        logger.error(f"Failed to list rooms: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list rooms: {str(e)}")

@router.post("/remove-user")
async def remove_user(
    data: Dict[str, Any], 
    user: PGUser = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Remove a user from a room (admin only)"""
    try:
        room_id = data.get("room_id")
        user_email = data.get("user_email")
        
        if not room_id or not user_email:
            raise HTTPException(status_code=400, detail="Room ID and user email are required")
        
        # Check if current user is admin
        is_admin = db.execute(
            room_admins.select().where(
                (room_admins.c.room_id == room_id) & 
                (room_admins.c.user_id == user.id)
            )
        ).first()
        
        if not is_admin:
            raise HTTPException(status_code=403, detail="Only admins can remove users")
        
        # Find the user to remove
        user_to_remove = db.query(PGUser).filter(PGUser.email == user_email).first()
        if not user_to_remove:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user is a member of the room
        is_member = db.execute(
            room_members.select().where(
                (room_members.c.room_id == room_id) & 
                (room_members.c.user_id == user_to_remove.id)
            )
        ).first()
        
        if not is_member:
            raise HTTPException(status_code=400, detail="User is not a member of this room")
        
        # Check if user is an admin
        is_user_admin = db.execute(
            room_admins.select().where(
                (room_admins.c.room_id == room_id) & 
                (room_admins.c.user_id == user_to_remove.id)
            )
        ).first()
        
        # If removing an admin, check if this would leave the room without admins
        if is_user_admin:
            admin_count = db.execute(
                room_admins.select().where(room_admins.c.room_id == room_id)
            ).rowcount
            
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot remove the only admin")
        
        # Remove user from room
        db.execute(
            room_members.delete().where(
                (room_members.c.room_id == room_id) & 
                (room_members.c.user_id == user_to_remove.id)
            )
        )
        
        # Remove admin privileges if applicable
        if is_user_admin:
            db.execute(
                room_admins.delete().where(
                    (room_admins.c.room_id == room_id) & 
                    (room_admins.c.user_id == user_to_remove.id)
                )
            )
        
        db.commit()
        
        return {
            "message": "User removed from room successfully",
            "user": user_to_remove.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to remove user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to remove user: {str(e)}")

@router.get("/{room_id}/info")
async def get_room_info(
    room_id: str,
    user: PGUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific room"""
    try:
        # Find room
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Check if user is a member
        is_member = db.execute(
            room_members.select().where(
                (room_members.c.room_id == room_id) & 
                (room_members.c.user_id == user.id)
            )
        ).first()
        
        if not is_member:
            raise HTTPException(status_code=403, detail="You are not a member of this room")
        
        # Get members and admins
        member_ids = db.execute(
            room_members.select().where(room_members.c.room_id == room_id)
        ).fetchall()
        members = db.query(PGUser).filter(
            PGUser.id.in_([row.user_id for row in member_ids])
        ).all()
        
        admin_ids = db.execute(
            room_admins.select().where(room_admins.c.room_id == room_id)
        ).fetchall()
        admins = db.query(PGUser).filter(
            PGUser.id.in_([row.user_id for row in admin_ids])
        ).all()
        
        # Check if current user is admin
        is_current_user_admin = db.execute(
            room_admins.select().where(
                (room_admins.c.room_id == room_id) & 
                (room_admins.c.user_id == user.id)
            )
        ).first() is not None
        
        return {
            "room": {
                "id": room.id,
                "room_id": room.room_id,
                "name": room.name,
                "description": room.description,
                "created_by": room.created_by,
                "created_at": room.created_at.isoformat() if room.created_at else None,
                "members": [member.to_dict() for member in members],
                "admins": [admin.to_dict() for admin in admins],
                "member_count": len(members),
                "admin_count": len(admins),
                "is_admin": is_current_user_admin
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get room info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get room info: {str(e)}")

@router.api_route('/{full_path:path}', methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def catch_all_room(full_path: str, request: Request):
    return JSONResponse(status_code=status.HTTP_405_METHOD_NOT_ALLOWED, content={"detail": "Method not allowed", "path": f"/api/room/{full_path}"}) 