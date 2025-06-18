from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any, Optional
import json
import logging
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services.ai_service import ai_service
from services.encryption_service import encryption_service, get_topic_encryption_key
from core.config import settings
from core.database import get_db

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

# In-memory chat history (replace with database in production)
chat_history: Dict[str, List[Dict]] = {}

@router.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    await manager.connect(websocket, room_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle different message types
            if message_data.get("type") == "chat":
                await handle_chat_message(websocket, room_id, user_id, message_data)
            elif message_data.get("type") == "ai_request":
                await handle_ai_request(websocket, room_id, user_id, message_data)
            elif message_data.get("type") == "join_room":
                await handle_join_room(websocket, room_id, user_id)
            elif message_data.get("type") == "leave_room":
                await handle_leave_room(websocket, room_id, user_id)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, room_id)

async def handle_chat_message(websocket: WebSocket, room_id: str, user_id: str, message_data: Dict, db: Session = Depends(get_db)):
    """Handle regular chat messages"""
    try:
        topic_id = message_data.get("topic_id")
        if not topic_id:
            raise ValueError("topic_id is required for chat encryption")
        # Fetch the encryption key for this topic
        encryption_key = get_topic_encryption_key(db, topic_id)
        # Encrypt the message for end-to-end security
        encrypted_message = encryption_service.encrypt_message(
            message_data.get("content", ""),
            room_id
        )
        
        # Create message object
        message = {
            "message_id": f"msg_{datetime.now().timestamp()}",
            "room_id": room_id,
            "user_id": user_id,
            "content": encrypted_message,
            "original_content": message_data.get("content", ""),
            "message_type": "user",
            "timestamp": datetime.now().isoformat(),
            "is_encrypted": True
        }
        
        # Store in chat history
        if room_id not in chat_history:
            chat_history[room_id] = []
        chat_history[room_id].append(message)
        
        # Broadcast to all clients in the room
        await manager.broadcast_to_room(
            json.dumps({
                "type": "chat_message",
                "data": message
            }),
            room_id
        )
        
        # Send confirmation to sender
        await manager.send_personal_message(
            json.dumps({
                "type": "message_sent",
                "data": {"message_id": message["message_id"]}
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

async def handle_ai_request(websocket: WebSocket, room_id: str, user_id: str, message_data: Dict, db: Session = Depends(get_db)):
    """Handle AI chat requests"""
    try:
        topic_id = message_data.get("topic_id")
        if not topic_id:
            raise ValueError("topic_id is required for chat encryption")
        # Fetch the encryption key for this topic
        encryption_key = get_topic_encryption_key(db, topic_id)
        # Get chat history for context
        room_history = chat_history.get(room_id, [])
        
        # Format history for AI
        formatted_history = []
        for msg in room_history[-20:]:  # Last 20 messages
            formatted_history.append({
                "type": msg["message_type"],
                "content": msg.get("original_content", msg["content"])
            })
        
        # Generate AI response
        ai_response = await ai_service.generate_group_chat_response(
            message=message_data.get("content", ""),
            chat_history=formatted_history,
            room_id=room_id,
            user_id=user_id
        )
        
        # Create AI message object
        ai_message = {
            "message_id": f"ai_{datetime.now().timestamp()}",
            "room_id": room_id,
            "user_id": "ai_assistant",
            "content": ai_response["response"],  # Encrypted response
            "original_content": ai_response["original_response"],
            "message_type": "ai",
            "timestamp": datetime.now().isoformat(),
            "is_encrypted": True,
            "metadata": {
                "tokens_used": ai_response.get("tokens_used"),
                "processing_time": ai_response.get("processing_time"),
                "model_used": ai_response.get("model_used")
            }
        }
        
        # Store in chat history
        if room_id not in chat_history:
            chat_history[room_id] = []
        chat_history[room_id].append(ai_message)
        
        # Broadcast AI response to all clients in the room
        await manager.broadcast_to_room(
            json.dumps({
                "type": "ai_response",
                "data": ai_message
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

async def handle_join_room(websocket: WebSocket, room_id: str, user_id: str):
    """Handle user joining a room"""
    try:
        # Send room history to the new user
        room_history = chat_history.get(room_id, [])
        
        await manager.send_personal_message(
            json.dumps({
                "type": "room_history",
                "data": {
                    "room_id": room_id,
                    "messages": room_history[-50:]  # Last 50 messages
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
                    "timestamp": datetime.now().isoformat()
                }
            }),
            room_id,
            exclude_websocket=websocket
        )
    
    except Exception as e:
        logger.error(f"Error handling join room: {e}")

async def handle_leave_room(websocket: WebSocket, room_id: str, user_id: str):
    """Handle user leaving a room"""
    try:
        # Notify other users
        await manager.broadcast_to_room(
            json.dumps({
                "type": "user_left",
                "data": {
                    "user_id": user_id,
                    "room_id": room_id,
                    "timestamp": datetime.now().isoformat()
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
        if message.room_id not in chat_history:
            chat_history[message.room_id] = []
        
        chat_history[message.room_id].append({
            "message_id": response.message_id,
            "room_id": response.room_id,
            "user_id": response.user_id,
            "content": response.content,
            "original_content": message.message,
            "message_type": response.message_type,
            "timestamp": response.timestamp.isoformat(),
            "is_encrypted": True
        })
        
        return response
    
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.post("/ai/chat")
async def ai_chat(request: AIRequest):
    """Generate AI response for group chat"""
    try:
        # Get room history
        room_history = chat_history.get(request.room_id, [])
        
        # Format history for AI
        formatted_history = []
        for msg in room_history[-20:]:
            formatted_history.append({
                "type": msg["message_type"],
                "content": msg.get("original_content", msg["content"])
            })
        
        # Generate AI response
        ai_response = await ai_service.generate_group_chat_response(
            message=request.message,
            chat_history=formatted_history,
            room_id=request.room_id,
            user_id=request.user_id
        )
        
        # Create AI message
        ai_message = {
            "message_id": f"ai_{datetime.now().timestamp()}",
            "room_id": request.room_id,
            "user_id": "ai_assistant",
            "content": ai_response["response"],
            "original_content": ai_response["original_response"],
            "message_type": "ai",
            "timestamp": datetime.now().isoformat(),
            "is_encrypted": True,
            "metadata": {
                "tokens_used": ai_response.get("tokens_used"),
                "processing_time": ai_response.get("processing_time"),
                "model_used": ai_response.get("model_used")
            }
        }
        
        # Store in chat history
        if request.room_id not in chat_history:
            chat_history[request.room_id] = []
        chat_history[request.room_id].append(ai_message)
        
        return ai_message
    
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI response")

@router.get("/history/{room_id}")
async def get_chat_history(room_id: str, limit: int = 50):
    """Get chat history for a room"""
    try:
        room_history = chat_history.get(room_id, [])
        return {
            "room_id": room_id,
            "messages": room_history[-limit:],
            "total_messages": len(room_history)
        }
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get chat history")

@router.delete("/history/{room_id}")
async def clear_chat_history(room_id: str):
    """Clear chat history for a room"""
    try:
        if room_id in chat_history:
            del chat_history[room_id]
        return {"message": "Chat history cleared", "room_id": room_id}
    except Exception as e:
        logger.error(f"Error clearing chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear chat history") 