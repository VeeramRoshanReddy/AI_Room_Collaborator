from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request
from typing import List, Dict, Any, Optional
import json
import logging
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db, get_mongo_db
from services.ai_service import ai_service
from services.encryption_service import encryption_service, get_topic_encryption_key
from core.config import settings
from models.postgresql.room import Room, room_members
from models.postgresql.topic import Topic
from models.postgresql.user import User
from models.mongodb.chat_log import ChatLog, ChatMessage
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        logger.info(f"Client connected to room {room_id}")
    
    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        logger.info(f"Client disconnected from room {room_id}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast_to_room(self, message: str, room_id: str, exclude_websocket: WebSocket = None):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_text(message)
                    except Exception as e:
                        logger.error(f"Error sending message to client: {e}")
                        # Remove broken connection
                        self.active_connections[room_id].remove(connection)

manager = ConnectionManager()

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

def is_room_member(db: Session, room_id: str, user_id: str) -> bool:
    return db.execute(room_members.select().where((room_members.c.room_id == room_id) & (room_members.c.user_id == user_id))).rowcount > 0

@router.websocket("/ws/{room_id}/{topic_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, topic_id: str, user_id: str, db: Session = Depends(get_db)):
    # Membership check
    if not is_room_member(db, room_id, user_id):
        await websocket.close(code=4001)
        return
    await manager.connect(websocket, room_id)
    mongo_db = get_mongo_db()
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle different message types
            if message_data.get("type") == "chat":
                await handle_chat_message(websocket, room_id, topic_id, user_id, message_data, db, mongo_db)
            elif message_data.get("type") == "ai_request":
                await handle_ai_request(websocket, room_id, topic_id, user_id, message_data, db, mongo_db)
            elif message_data.get("type") == "join_room":
                await handle_join_room(websocket, room_id, topic_id, user_id, mongo_db)
            elif message_data.get("type") == "leave_room":
                await handle_leave_room(websocket, room_id, topic_id, user_id, mongo_db)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, room_id)

async def handle_chat_message(websocket: WebSocket, room_id: str, topic_id: str, user_id: str, message_data: Dict, db: Session, mongo_db):
    """Handle regular chat messages"""
    try:
        # Fetch the encryption key for this topic
        encryption_key = get_topic_encryption_key(db, topic_id)
        # Encrypt the message for end-to-end security
        encrypted_message = encryption_service.encrypt_message(
            message_data.get("content", ""),
            room_id
        )
        
        # Create message object
        message = ChatMessage(
            message_id=str(uuid.uuid4()),
            room_id=room_id,
            user_id=user_id,
            message=encrypted_message,
            message_type="user",
            timestamp=datetime.utcnow()
        )
        
        # Store in MongoDB
        chat_log = await mongo_db.chat_logs.find_one({"room_id": room_id, "topic_id": topic_id})
        if not chat_log:
            chat_log_doc = {
                "room_id": room_id,
                "topic_id": topic_id,
                "messages": [message.dict()],
                "is_active": True,
                "last_activity": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await mongo_db.chat_logs.insert_one(chat_log_doc)
        else:
            await mongo_db.chat_logs.update_one(
                {"_id": chat_log["_id"]},
                {"$push": {"messages": message.dict()}, "$set": {"last_activity": datetime.utcnow(), "updated_at": datetime.utcnow()}}
            )
        
        # Broadcast to all clients in the room
        await manager.broadcast_to_room(
            json.dumps({
                "type": "chat_message",
                "data": message.dict()
            }),
            room_id
        )
        
        # Send confirmation to sender
        await manager.send_personal_message(
            json.dumps({
                "type": "message_sent",
                "data": {"message_id": message.message_id}
            }),
            websocket
        )
    
    except Exception as e:
        logger.error(f"Error handling chat message: {e}")
        await manager.send_personal_message(
            json.dumps({
                "type": "error",
                "data": {"message": "Failed to send message"}
            }),
            websocket
        )

async def handle_ai_request(websocket: WebSocket, room_id: str, topic_id: str, user_id: str, message_data: Dict, db: Session, mongo_db):
    """Handle AI chat requests"""
    try:
        # Only respond if message starts with @chatbot
        content = message_data.get("content", "")
        if not content.strip().startswith("@chatbot"):
            return
        # Fetch the encryption key for this topic
        encryption_key = get_topic_encryption_key(db, topic_id)
        # Get chat history for context
        chat_log = await mongo_db.chat_logs.find_one({"room_id": room_id, "topic_id": topic_id})
        room_history = chat_log["messages"] if chat_log else []
        
        # Format history for AI
        formatted_history = [
            {"type": msg["message_type"], "content": msg.get("content", "")}
            for msg in room_history[-20:]
        ]
        
        # Generate AI response
        ai_response = await ai_service.generate_group_chat_response(
            message=content,
            chat_history=formatted_history,
            room_id=room_id,
            user_id=user_id
        )
        
        # Encrypt AI response
        encrypted_ai_response = encryption_service.encrypt_message(
            ai_response["response"],
            room_id
        )
        
        # Create AI message object
        ai_message = ChatMessage(
            message_id=str(uuid.uuid4()),
            room_id=room_id,
            user_id="ai_assistant",
            message=encrypted_ai_response,
            message_type="ai",
            timestamp=datetime.utcnow(),
            is_ai=True,
            metadata={
                "tokens_used": ai_response.get("tokens_used"),
                "processing_time": ai_response.get("processing_time"),
                "model_used": ai_response.get("model_used")
            }
        )
        
        # Store in MongoDB
        if not chat_log:
            chat_log_doc = {
                "room_id": room_id,
                "topic_id": topic_id,
                "messages": [ai_message.dict()],
                "is_active": True,
                "last_activity": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await mongo_db.chat_logs.insert_one(chat_log_doc)
        else:
            await mongo_db.chat_logs.update_one(
                {"_id": chat_log["_id"]},
                {"$push": {"messages": ai_message.dict()}, "$set": {"last_activity": datetime.utcnow(), "updated_at": datetime.utcnow()}}
            )
        
        # Broadcast AI response to all clients in the room
        await manager.broadcast_to_room(
            json.dumps({
                "type": "ai_response",
                "data": ai_message.dict()
            }),
            room_id
        )
    
    except Exception as e:
        logger.error(f"Error handling AI request: {e}")
        await manager.send_personal_message(
            json.dumps({
                "type": "error",
                "data": {"message": "Failed to generate AI response"}
            }),
            websocket
        )

async def handle_join_room(websocket: WebSocket, room_id: str, topic_id: str, user_id: str, mongo_db):
    """Handle user joining a room"""
    try:
        # Send room history to the new user
        chat_log = await mongo_db.chat_logs.find_one({"room_id": room_id, "topic_id": topic_id})
        messages = chat_log["messages"][-50:] if chat_log else []
        
        await manager.send_personal_message(
            json.dumps({
                "type": "room_history",
                "data": {
                    "room_id": room_id,
                    "topic_id": topic_id,
                    "messages": messages
                }
            }),
            websocket
        )
        
        # Notify other users
        await manager.broadcast_to_room(
            json.dumps({
                "type": "user_joined",
                "data": {
                    "user_id": user_id,
                    "room_id": room_id,
                    "topic_id": topic_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }),
            room_id,
            exclude_websocket=websocket
        )
    
    except Exception as e:
        logger.error(f"Error handling join room: {e}")

async def handle_leave_room(websocket: WebSocket, room_id: str, topic_id: str, user_id: str, mongo_db):
    """Handle user leaving a room"""
    try:
        # Notify other users
        await manager.broadcast_to_room(
            json.dumps({
                "type": "user_left",
                "data": {
                    "user_id": user_id,
                    "room_id": room_id,
                    "topic_id": topic_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }),
            room_id,
            exclude_websocket=websocket
        )
    
    except Exception as e:
        logger.error(f"Error handling leave room: {e}")

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

@router.delete("/history/{room_id}/{topic_id}")
async def clear_chat_history(room_id: str, topic_id: str):
    """Clear chat history for a room"""
    try:
        mongo_db = get_mongo_db()
        await mongo_db.chat_logs.delete_one({"room_id": room_id, "topic_id": topic_id})
        return {"message": "Chat history cleared", "room_id": room_id, "topic_id": topic_id}
    except Exception as e:
        logger.error(f"Error clearing chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear chat history") 