from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from pydantic import BaseModel
from core.database import get_db
from middleware.auth_middleware import get_current_user
from models.postgresql.topic import Topic
from models.postgresql.room import Room, RoomParticipant
from models.postgresql.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/topics", tags=["Topics"])

# Pydantic models
class TopicCreate(BaseModel):
    title: str
    description: Optional[str] = None
    room_id: str

class TopicResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    room_id: str
    created_by_user_id: str
    creator_name: Optional[str]
    creator_picture: Optional[str]
    is_active: bool
    created_at: str
    updated_at: Optional[str]
    can_delete: bool = False

@router.post("/create", response_model=TopicResponse)
async def create_topic(
    topic_data: TopicCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new topic in a room"""
    try:
        # Check if user is a participant in the room
        participation = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == topic_data.room_id,
            RoomParticipant.user_id == current_user["id"]
        ).first()
        
        if not participation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a participant in the room to create topics"
            )
        
        # Check if room exists and is active
        room = db.query(Room).filter(
            Room.id == topic_data.room_id,
            Room.is_active == True
        ).first()
        
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found or inactive"
            )
        
        # Create topic
        new_topic = Topic(
            title=topic_data.title,
            description=topic_data.description,
            room_id=topic_data.room_id,
            created_by_user_id=current_user["id"]
        )
        
        db.add(new_topic)
        db.commit()
        db.refresh(new_topic)
        
        # Return topic data
        response_data = new_topic.to_dict()
        response_data["can_delete"] = True  # Creator can always delete
        
        return TopicResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating topic: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create topic"
        )

@router.get("/room/{room_id}", response_model=List[TopicResponse])
async def get_room_topics(
    room_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all topics in a room"""
    try:
        # Check if user is a participant in the room
        participation = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == room_id,
            RoomParticipant.user_id == current_user["id"]
        ).first()
        
        if not participation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a participant in the room to view topics"
            )
        
        # Get all active topics in the room
        topics = db.query(Topic).filter(
            Topic.room_id == room_id,
            Topic.is_active == True
        ).all()
        
        # Prepare response with delete permissions
        response_topics = []
        for topic in topics:
            topic_data = topic.to_dict()
            # Check if user can delete this topic (creator or admin)
            can_delete = (
                topic.created_by_user_id == current_user["id"] or 
                participation.is_admin
            )
            topic_data["can_delete"] = can_delete
            response_topics.append(TopicResponse(**topic_data))
        
        return response_topics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting room topics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get topics"
        )

@router.get("/{topic_id}", response_model=TopicResponse)
async def get_topic(
    topic_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific topic"""
    try:
        # Get topic
        topic = db.query(Topic).filter(
            Topic.id == topic_id,
            Topic.is_active == True
        ).first()
        
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Topic not found"
            )
        
        # Check if user is a participant in the room
        participation = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == topic.room_id,
            RoomParticipant.user_id == current_user["id"]
        ).first()
        
        if not participation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a participant in the room to view this topic"
            )
        
        # Prepare response with delete permissions
        topic_data = topic.to_dict()
        can_delete = (
            topic.created_by_user_id == current_user["id"] or 
            participation.is_admin
        )
        topic_data["can_delete"] = can_delete
        
        return TopicResponse(**topic_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting topic: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get topic"
        )

@router.delete("/{topic_id}")
async def delete_topic(
    topic_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a topic (only topic creator or room admin can do this)"""
    try:
        # Get topic
        topic = db.query(Topic).filter(
            Topic.id == topic_id,
            Topic.is_active == True
        ).first()
        
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Topic not found"
            )
        
        # Check if user is a participant in the room
        participation = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == topic.room_id,
            RoomParticipant.user_id == current_user["id"]
        ).first()
        
        if not participation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a participant in the room to delete topics"
            )
        
        # Check if user can delete (creator or admin)
        can_delete = (
            topic.created_by_user_id == current_user["id"] or 
            participation.is_admin
        )
        
        if not can_delete:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only topic creator or room admin can delete topics"
            )
        
        # Soft delete the topic
        topic.is_active = False
        db.commit()
        
        return {"message": "Topic deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting topic: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete topic"
        )

@router.get("/{topic_id}/encryption-key")
async def get_topic_encryption_key(
    topic_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get topic encryption key for WebSocket chat (only room participants)"""
    try:
        # Get topic
        topic = db.query(Topic).filter(
            Topic.id == topic_id,
            Topic.is_active == True
        ).first()
        
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Topic not found"
            )
        
        # Check if user is a participant in the room
        participation = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == topic.room_id,
            RoomParticipant.user_id == current_user["id"]
        ).first()
        
        if not participation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a participant in the room to access this topic"
            )
        
        # Return encryption key
        return {
            "encryption_key": topic.encryption_key,
            "topic_id": topic.id,
            "room_id": topic.room_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting topic encryption key: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get encryption key"
        ) 