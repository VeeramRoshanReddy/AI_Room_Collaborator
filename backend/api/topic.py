from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from models.postgresql.topic import Topic
from models.postgresql.room import Room, room_admins
from models.postgresql.user import User
import uuid
import os
import base64
from Crypto.Random import get_random_bytes

router = APIRouter()

# Helper: get current user from session cookie
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("airoom_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
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

def generate_aes256_key() -> str:
    return base64.urlsafe_b64encode(get_random_bytes(32)).decode()

@router.post("/create")
async def create_topic(data: Dict[str, Any], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new topic in a room. Everyone in room auto joins the topic."""
    room_id = data.get("room_id")
    title = data.get("title")
    description = data.get("description", "")
    if not room_id or not title:
        raise HTTPException(status_code=400, detail="Room ID and title required")
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    # Generate encryption key
    encryption_key = generate_aes256_key()
    topic_id = str(uuid.uuid4())
    topic = Topic(
        id=topic_id,
        title=title,
        description=description,
        room_id=room_id,
        created_by=user.id,
        encryption_key=encryption_key
    )
    db.add(topic)
    db.commit()
    return {"topic_id": topic_id, "encryption_key": encryption_key, "message": "Topic created"}

@router.get("/list/{room_id}")
async def list_topics(room_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all topics in a room."""
    topics = db.query(Topic).filter(Topic.room_id == room_id).all()
    return {"topics": [t.to_dict() for t in topics]}

@router.delete("/delete")
async def delete_topic(data: Dict[str, Any], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a topic. Only topic creator or room admin can delete."""
    topic_id = data.get("topic_id")
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    # Check permissions
    is_admin = db.execute(room_admins.select().where((room_admins.c.room_id == topic.room_id) & (room_admins.c.user_id == user.id))).rowcount > 0
    if topic.created_by != user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Only topic creator or room admin can delete topic")
    db.delete(topic)
    db.commit()
    # TODO: Cascade delete chat logs in MongoDB
    return {"message": "Topic deleted", "topic_id": topic_id} 