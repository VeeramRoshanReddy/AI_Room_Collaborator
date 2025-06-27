from fastapi import APIRouter, HTTPException, Depends, Request, status
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from models.postgresql.room import Room, room_members, room_admins, RoomParticipant
from models.postgresql.user import User as PGUser
from models.postgresql.topic import Topic
import uuid
from fastapi.responses import JSONResponse
from middleware.auth_middleware import get_current_user
import logging
import secrets
import string
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rooms", tags=["Rooms"])

try:
    import jwt
except ImportError:
    # jwt is required for authentication. Please install with 'pip install PyJWT'
    jwt = None

# Pydantic models
class RoomCreate(BaseModel):
    title: str
    description: Optional[str] = None

class RoomJoin(BaseModel):
    room_id: str  # 8-digit room ID
    password: str  # 8-digit password

class RoomResponse(BaseModel):
    id: str
    name: str  # Keep as 'name' for frontend compatibility
    description: Optional[str]
    room_id: str
    owner_id: str  # Keep as 'owner_id' for frontend compatibility
    creator_name: Optional[str]
    is_active: bool
    created_at: str
    updated_at: Optional[str]
    participant_count: int
    topic_count: int
    is_admin: bool = False
    is_private: bool
    members: List[str]
    admins: List[str]
    topics: List[str]

class ParticipantResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    user_picture: Optional[str]
    is_admin: bool
    joined_at: str

@router.post("/create", response_model=RoomResponse)
async def create_room(
    room_data: RoomCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new room"""
    try:
        # Generate unique room ID and password
        room_id = _generate_unique_room_id(db)
        password = _generate_room_password()
        
        # Create room
        new_room = Room(
            title=room_data.title,
            description=room_data.description,
            room_id=room_id,
            password=password,
            created_by_user_id=current_user['id'] if isinstance(current_user, dict) else current_user.id
        )
        
        db.add(new_room)
        db.commit()
        db.refresh(new_room)
        
        # Add creator as admin participant
        participant = RoomParticipant(
            room_id=new_room.id,
            user_id=current_user['id'] if isinstance(current_user, dict) else current_user.id,
            is_admin=True
        )
        db.add(participant)
        db.commit()
        
        # Return room with password (only for creator)
        response_data = new_room.to_dict()
        response_data["password"] = password  # Include password for creator
        response_data["name"] = response_data.pop("title", "")  # Map title to name for frontend
        response_data["owner_id"] = response_data.pop("created_by_user_id", "")  # Map created_by_user_id to owner_id for frontend
        response_data["is_admin"] = True
        response_data["is_private"] = False
        response_data["members"] = [current_user['id'] if isinstance(current_user, dict) else current_user.id]
        response_data["admins"] = [current_user['id'] if isinstance(current_user, dict) else current_user.id]
        response_data["topics"] = []
        
        return RoomResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error creating room: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create room"
        )

@router.post("/join", response_model=RoomResponse)
async def join_room(
    join_data: RoomJoin,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a room using room ID and password"""
    try:
        # Find room by room_id
        room = db.query(Room).filter(
            Room.room_id == join_data.room_id,
            Room.is_active == True
        ).first()
        
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found"
            )
        
        # Verify password
        if room.password != join_data.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid room password"
            )
        
        # Check if user is already a participant
        existing_participant = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == room.id,
            RoomParticipant.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id)
        ).first()
        
        if existing_participant:
            # User is already in the room
            is_admin = existing_participant.is_admin
        else:
            # Add user as participant
            participant = RoomParticipant(
                room_id=room.id,
                user_id=(current_user['id'] if isinstance(current_user, dict) else current_user.id),
                is_admin=False
            )
            db.add(participant)
            db.commit()
            is_admin = False
        
        # Return room data
        response_data = room.to_dict_without_password()
        response_data["name"] = response_data.pop("title", "")  # Map title to name for frontend
        response_data["owner_id"] = response_data.pop("created_by_user_id", "")  # Map created_by_user_id to owner_id for frontend
        response_data["is_admin"] = is_admin
        response_data["is_private"] = False
        response_data["members"] = [current_user['id'] if isinstance(current_user, dict) else current_user.id]
        response_data["admins"] = [current_user['id'] if isinstance(current_user, dict) else current_user.id]
        response_data["topics"] = []
        
        return RoomResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining room: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join room"
        )

@router.get("/my-rooms", response_model=List[RoomResponse])
async def get_my_rooms(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all rooms where current user is a participant"""
    try:
        participations = db.query(RoomParticipant).filter(
            RoomParticipant.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id)
        ).all()
        rooms = []
        if not participations:
            return rooms
        for participation in participations:
            room = getattr(participation, 'room', None)
            if room and getattr(room, 'is_active', False):
                room_data = room.to_dict_without_password()
                room_data["name"] = room_data.pop("title", "")  # Map title to name for frontend
                room_data["owner_id"] = room_data.pop("created_by_user_id", "")  # Map created_by_user_id to owner_id for frontend
                room_data["is_admin"] = participation.is_admin
                room_data["is_private"] = False
                room_data["members"] = [current_user['id'] if isinstance(current_user, dict) else current_user.id]
                room_data["admins"] = [current_user['id'] if isinstance(current_user, dict) else current_user.id]
                room_data["topics"] = []
                rooms.append(RoomResponse(**room_data))
        return rooms
    except Exception as e:
        logger.error(f"Error getting user rooms: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get rooms"
        )

@router.get("/{room_id}/participants", response_model=List[ParticipantResponse])
async def get_room_participants(
    room_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all participants in a room"""
    try:
        # Check if user is participant in this room
        user_participation = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == room_id,
            RoomParticipant.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id)
        ).first()
        
        if not user_participation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a participant in this room"
            )
        
        # Get all participants
        participants = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == room_id
        ).all()
        
        return [ParticipantResponse(**participant.to_dict()) for participant in participants]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting room participants: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get participants"
        )

@router.post("/{room_id}/leave")
async def leave_room(
    room_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave a room"""
    try:
        # Get user's participation
        participation = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == room_id,
            RoomParticipant.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id)
        ).first()
        
        if not participation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="You are not a participant in this room"
            )
        
        # Check if user is the only admin
        if participation.is_admin:
            admin_count = db.query(RoomParticipant).filter(
                RoomParticipant.room_id == room_id,
                RoomParticipant.is_admin == True
            ).count()
            
            if admin_count == 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot leave room: you are the only admin. Promote another member to admin first."
                )
        
        # Remove participation
        db.delete(participation)
        db.commit()
        
        return {"message": "Successfully left the room"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error leaving room: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to leave room"
        )

@router.post("/{room_id}/promote/{user_id}")
async def promote_to_admin(
    room_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Promote a user to admin (only room admins can do this)"""
    try:
        # Check if current user is admin
        current_participation = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == room_id,
            RoomParticipant.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id),
            RoomParticipant.is_admin == True
        ).first()
        
        if not current_participation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can promote users"
            )
        
        # Get target user's participation
        target_participation = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == room_id,
            RoomParticipant.user_id == user_id
        ).first()
        
        if not target_participation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User is not a participant in this room"
            )
        
        if target_participation.is_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already an admin"
            )
        
        # Promote user
        target_participation.is_admin = True
        db.commit()
        
        return {"message": "User promoted to admin successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error promoting user: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to promote user"
        )

@router.delete("/{room_id}/remove/{user_id}")
async def remove_participant(
    room_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a participant from room (only admins can do this)"""
    try:
        # Check if current user is admin
        current_participation = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == room_id,
            RoomParticipant.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id),
            RoomParticipant.is_admin == True
        ).first()
        
        if not current_participation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can remove participants"
            )
        
        # Prevent removing yourself
        if user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove yourself. Use leave room instead."
            )
        
        # Get target user's participation
        target_participation = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == room_id,
            RoomParticipant.user_id == user_id
        ).first()
        
        if not target_participation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User is not a participant in this room"
            )
        
        # Remove participant
        db.delete(target_participation)
        db.commit()
        
        return {"message": "Participant removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing participant: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove participant"
        )

@router.delete("/{room_id}")
async def delete_room(
    room_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a room (only admins can do this)"""
    try:
        # Check if current user is admin
        participation = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == room_id,
            RoomParticipant.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id),
            RoomParticipant.is_admin == True
        ).first()
        
        if not participation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can delete rooms"
            )
        
        # Get room
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found"
            )
        
        # Delete room (cascade will handle participants and topics)
        db.delete(room)
        db.commit()
        
        return {"message": "Room deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting room: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete room"
        )

def _generate_unique_room_id(db: Session) -> str:
    """Generate a unique 8-digit room ID"""
    while True:
        room_id = ''.join(secrets.choice(string.digits) for _ in range(8))
        # Check if room_id already exists
        existing_room = db.query(Room).filter(Room.room_id == room_id).first()
        if not existing_room:
            return room_id

def _generate_room_password() -> str:
    """Generate a random 8-digit password"""
    return ''.join(secrets.choice(string.digits) for _ in range(8))

@router.api_route('/{full_path:path}', methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def catch_all_room(full_path: str, request: Request):
    return JSONResponse(status_code=status.HTTP_405_METHOD_NOT_ALLOWED, content={"detail": "Method not allowed", "path": f"/api/room/{full_path}"}) 