from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any, Optional
import json
import logging
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db, get_mongo_db
from services.ai_service import ai_service
from services.encryption_service import encryption_service
from models.postgresql.room import RoomParticipant
from models.postgresql.topic import Topic
from models.postgresql.user import User as PGUser
from middleware.auth_middleware import get_current_user
from fastapi.responses import JSONResponse
from fastapi import status

logger = logging.getLogger(__name__)
router = APIRouter()

# Note: real-time chat happens over the websocket registered in core/websocket.py
# (mounted at /ws/{room_id}/{topic_id} in main.py). This router only exposes
# REST endpoints for sending/fetching/deleting chat history.

# Pydantic models
class ChatMessage(BaseModel):
    room_id: str
    user_id: str
    message: str
    message_type: str = "user"  # user, ai, system
    timestamp: Optional[datetime] = None

class AIRequest(BaseModel):
    room_id: str
    user_id: str
    message: str
    chat_history: List[Dict[str, Any]] = []

class ChatResponse(BaseModel):
    message_id: str
    room_id: str
    user_id: str
    content: str
    message_type: str
    timestamp: datetime
    is_encrypted: bool = True

# REST API endpoints
@router.post("/send", response_model=ChatResponse)
async def send_message(message: ChatMessage):
    """Send a message to a room (REST API)"""
    try:
        # Encrypt the message
        encrypted_content = encryption_service.encrypt_message(message.message, message.room_id)
        
        # Create response
        response = ChatResponse(
            message_id=f"msg_{datetime.now().timestamp()}",
            room_id=message.room_id,
            user_id=message.user_id,
            content=encrypted_content,
            message_type=message.message_type,
            timestamp=message.timestamp or datetime.now(),
            is_encrypted=True
        )
        
        # Store in chat history
        mongo_db = get_mongo_db()
        if mongo_db is None:
            raise HTTPException(status_code=500, detail="MongoDB connection not available")
        
        chat_log = await mongo_db.chat_logs.find_one({"room_id": message.room_id})
        if not chat_log:
            chat_log_doc = {
                "room_id": message.room_id,
                "messages": [response.dict()]
            }
            await mongo_db.chat_logs.insert_one(chat_log_doc)
        else:
            await mongo_db.chat_logs.update_one(
                {"_id": chat_log["_id"]},
                {"$push": {"messages": response.dict()}}
            )
        
        return response
    
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.post("/ai/chat")
async def ai_chat(request: AIRequest):
    """Generate AI response for group chat"""
    try:
        # Get room history
        mongo_db = get_mongo_db()
        if mongo_db is None:
            raise HTTPException(status_code=500, detail="MongoDB connection not available")
        
        chat_log = await mongo_db.chat_logs.find_one({"room_id": request.room_id})
        room_history = chat_log["messages"] if chat_log else []
        
        # Format history for AI
        formatted_history = [
            {"type": msg["message_type"], "content": msg.get("content", "")}
            for msg in room_history[-20:]
        ]
        
        # Generate AI response
        ai_response = await ai_service.generate_group_chat_response(
            message=request.message,
            chat_history=formatted_history,
            room_id=request.room_id,
            user_id=request.user_id
        )
        
        # Create AI message
        ai_message = ChatMessage(
            message_id=f"ai_{datetime.now().timestamp()}",
            room_id=request.room_id,
            user_id="ai_assistant",
            message=ai_response["response"],
            message_type="ai",
            timestamp=datetime.now(),
            is_ai=True,
            metadata={
                "tokens_used": ai_response.get("tokens_used"),
                "processing_time": ai_response.get("processing_time"),
                "model_used": ai_response.get("model_used")
            }
        )
        
        # Store in chat history
        if not chat_log:
            chat_log_doc = {
                "room_id": request.room_id,
                "messages": [ai_message.dict()]
            }
            await mongo_db.chat_logs.insert_one(chat_log_doc)
        else:
            await mongo_db.chat_logs.update_one(
                {"_id": chat_log["_id"]},
                {"$push": {"messages": ai_message.dict()}}
            )
        
        return ai_message
    
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI response")

@router.get("/history/{room_id}/{topic_id}")
async def get_chat_history(room_id: str, topic_id: str, limit: int = 50):
    """Get chat history for a room"""
    try:
        mongo_db = get_mongo_db()
        if mongo_db is None:
            raise HTTPException(status_code=500, detail="MongoDB connection not available")
        
        chat_log = await mongo_db.chat_logs.find_one({"room_id": room_id, "topic_id": topic_id})
        messages = chat_log["messages"][-limit:] if chat_log else []
        return {
            "room_id": room_id,
            "topic_id": topic_id,
            "messages": messages,
            "total_messages": len(messages)
        }
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get chat history")

@router.delete("/delete")
async def delete_chat(data: Dict[str, Any], user: PGUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete chat messages for a specific room and topic"""
    try:
        room_id = data.get("room_id")
        topic_title = data.get("topic_title")

        if not room_id or not topic_title:
            raise HTTPException(status_code=400, detail="Room ID and topic title required")

        # Check if user is admin of the room
        is_admin = db.query(RoomParticipant).filter(
            RoomParticipant.room_id == room_id,
            RoomParticipant.user_id == user.id,
            RoomParticipant.is_admin == True
        ).first() is not None
        if not is_admin:
            raise HTTPException(status_code=403, detail="Only admins can delete chat conversations")
        
        # Get topic ID from topic title
        topic = db.query(Topic).filter(Topic.room_id == room_id, Topic.title == topic_title).first()
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        mongo_db = get_mongo_db()
        if mongo_db is None:
            raise HTTPException(status_code=500, detail="MongoDB connection not available")
        
        # Delete chat messages for this topic
        result = await mongo_db.chat_logs.delete_one({
            "room_id": room_id,
            "topic_id": topic.id
        })
        
        if result.deleted_count > 0:
            return {"message": "Chat conversation deleted successfully", "room_id": room_id, "topic_title": topic_title}
        else:
            return {"message": "No chat messages found to delete", "room_id": room_id, "topic_title": topic_title}
            
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error deleting chat: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete chat: {str(e)}")

@router.api_route('/{full_path:path}', methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def catch_all_chat(full_path: str, request: Request):
    return JSONResponse(status_code=status.HTTP_405_METHOD_NOT_ALLOWED, content={"detail": "Method not allowed", "path": f"/api/chat/{full_path}"}) 