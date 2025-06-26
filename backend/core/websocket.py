from fastapi import WebSocket, WebSocketDisconnect, HTTPException, Depends
from typing import Dict, List, Optional
import json
import logging
from datetime import datetime
from core.database import get_mongo_db
from models.mongodb.chat_log import ChatLog, ChatMessage
from services.encryption_service import EncryptionService
from middleware.websocket_auth import get_user_from_token
import asyncio

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time chat"""
    
    def __init__(self):
        # Store active connections by room_id -> topic_id -> user_id -> WebSocket
        self.active_connections: Dict[str, Dict[str, Dict[str, WebSocket]]] = {}
        self.encryption_service = EncryptionService()
    
    async def connect(self, websocket: WebSocket, room_id: str, topic_id: str, user_id: str):
        """Connect a user to a specific topic in a room"""
        await websocket.accept()
        
        # Initialize room and topic if they don't exist
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        if topic_id not in self.active_connections[room_id]:
            self.active_connections[room_id][topic_id] = {}
        
        # Store the connection
        self.active_connections[room_id][topic_id][user_id] = websocket
        
        logger.info(f"User {user_id} connected to room {room_id}, topic {topic_id}")
        
        # Send connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "room_id": room_id,
            "topic_id": topic_id,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        # Notify other users in the topic
        await self.broadcast_to_topic(
            room_id, topic_id, user_id,
            {
                "type": "user_joined",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    def disconnect(self, room_id: str, topic_id: str, user_id: str):
        """Disconnect a user from a topic"""
        try:
            if (room_id in self.active_connections and 
                topic_id in self.active_connections[room_id] and 
                user_id in self.active_connections[room_id][topic_id]):
                
                del self.active_connections[room_id][topic_id][user_id]
                
                # Clean up empty topic
                if not self.active_connections[room_id][topic_id]:
                    del self.active_connections[room_id][topic_id]
                
                # Clean up empty room
                if not self.active_connections[room_id]:
                    del self.active_connections[room_id]
                
                logger.info(f"User {user_id} disconnected from room {room_id}, topic {topic_id}")
                
        except Exception as e:
            logger.error(f"Error disconnecting user {user_id}: {e}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
    
    async def broadcast_to_topic(self, room_id: str, topic_id: str, sender_id: str, message: dict):
        """Broadcast a message to all users in a specific topic"""
        if (room_id not in self.active_connections or 
            topic_id not in self.active_connections[room_id]):
            return
        
        disconnected_users = []
        
        for user_id, websocket in self.active_connections[room_id][topic_id].items():
            try:
                # Don't send to sender
                if user_id != sender_id:
                    await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to user {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            self.disconnect(room_id, topic_id, user_id)
    
    async def broadcast_to_room(self, room_id: str, sender_id: str, message: dict):
        """Broadcast a message to all users in a room across all topics"""
        if room_id not in self.active_connections:
            return
        
        for topic_id in self.active_connections[room_id]:
            await self.broadcast_to_topic(room_id, topic_id, sender_id, message)

manager = ConnectionManager()

class ChatWebSocket:
    def __init__(self, websocket: WebSocket, room_id: str, topic_id: str, user_id: str):
        self.websocket = websocket
        self.room_id = room_id
        self.topic_id = topic_id
        self.user_id = user_id
        self.mongo_db = get_mongo_db()
    
    async def handle_message(self, message_data: dict):
        """Handle incoming chat messages"""
        try:
            message_type = message_data.get("type")
            
            if message_type == "chat_message":
                await self.handle_chat_message(message_data)
            elif message_type == "ai_request":
                await self.handle_ai_request(message_data)
            elif message_type == "typing":
                await self.handle_typing_indicator(message_data)
            elif message_type == "read_receipt":
                await self.handle_read_receipt(message_data)
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self.send_error("Failed to process message")
    
    async def handle_chat_message(self, message_data: dict):
        """Handle regular chat messages"""
        try:
            content = message_data.get("content", "").strip()
            if not content:
                return
            
            # Create chat message
            chat_message = ChatMessage(
                message_id=f"msg_{datetime.utcnow().timestamp()}",
                user_id=self.user_id,
                user_name=message_data.get("user_name", "Unknown"),
                user_picture=message_data.get("user_picture"),
                content=content,
                message_type="text",
                timestamp=datetime.utcnow(),
                is_ai=False
            )
            
            # Encrypt message content
            encrypted_content = manager.encryption_service.encrypt_message(content)
            chat_message.content = encrypted_content
            
            # Save to database
            await self.save_message_to_db(chat_message)
            
            # Prepare message for broadcasting
            broadcast_message = {
                "type": "chat_message",
                "message_id": chat_message.message_id,
                "user_id": self.user_id,
                "user_name": chat_message.user_name,
                "user_picture": chat_message.user_picture,
                "content": content,  # Send decrypted content to clients
                "timestamp": chat_message.timestamp.isoformat(),
                "is_ai": False
            }
            
            # Broadcast to topic
            await manager.broadcast_to_topic(
                self.room_id, self.topic_id, self.user_id, broadcast_message
            )
            
        except Exception as e:
            logger.error(f"Error handling chat message: {e}")
            await self.send_error("Failed to send message")
    
    async def handle_ai_request(self, message_data: dict):
        """Handle AI chatbot requests"""
        try:
            content = message_data.get("content", "").strip()
            if not content or not content.startswith("@chatbot"):
                return
            
            # Extract the actual question
            question = content.replace("@chatbot", "").strip()
            if not question:
                return
            
            # Create AI message placeholder
            ai_message = ChatMessage(
                message_id=f"ai_{datetime.utcnow().timestamp()}",
                user_id="ai_bot",
                user_name="AI Assistant",
                user_picture=None,
                content=question,
                message_type="ai",
                timestamp=datetime.utcnow(),
                is_ai=True
            )
            
            # Save AI request to database
            await self.save_message_to_db(ai_message)
            
            # Send typing indicator
            await manager.broadcast_to_topic(
                self.room_id, self.topic_id, "ai_bot",
                {
                    "type": "ai_typing",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            # Get AI response
            ai_response = await self.get_ai_response(question)
            
            # Create AI response message
            ai_response_message = ChatMessage(
                message_id=f"ai_resp_{datetime.utcnow().timestamp()}",
                user_id="ai_bot",
                user_name="AI Assistant",
                user_picture=None,
                content=ai_response,
                message_type="ai",
                timestamp=datetime.utcnow(),
                is_ai=True
            )
            
            # Save AI response to database
            await self.save_message_to_db(ai_response_message)
            
            # Broadcast AI response
            broadcast_message = {
                "type": "chat_message",
                "message_id": ai_response_message.message_id,
                "user_id": "ai_bot",
                "user_name": "AI Assistant",
                "user_picture": None,
                "content": ai_response,
                "timestamp": ai_response_message.timestamp.isoformat(),
                "is_ai": True
            }
            
            await manager.broadcast_to_topic(
                self.room_id, self.topic_id, "ai_bot", broadcast_message
            )
            
        except Exception as e:
            logger.error(f"Error handling AI request: {e}")
            await self.send_error("Failed to get AI response")
    
    async def handle_typing_indicator(self, message_data: dict):
        """Handle typing indicators"""
        try:
            is_typing = message_data.get("is_typing", False)
            
            broadcast_message = {
                "type": "typing",
                "user_id": self.user_id,
                "user_name": message_data.get("user_name", "Unknown"),
                "is_typing": is_typing,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await manager.broadcast_to_topic(
                self.room_id, self.topic_id, self.user_id, broadcast_message
            )
            
        except Exception as e:
            logger.error(f"Error handling typing indicator: {e}")
    
    async def handle_read_receipt(self, message_data: dict):
        """Handle read receipts"""
        try:
            message_id = message_data.get("message_id")
            
            broadcast_message = {
                "type": "read_receipt",
                "user_id": self.user_id,
                "message_id": message_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await manager.broadcast_to_topic(
                self.room_id, self.topic_id, self.user_id, broadcast_message
            )
            
        except Exception as e:
            logger.error(f"Error handling read receipt: {e}")
    
    async def save_message_to_db(self, chat_message: ChatMessage):
        """Save message to MongoDB"""
        try:
            if not self.mongo_db:
                logger.error("MongoDB connection not available")
                return
                
            # Get or create chat log
            chat_log = await self.mongo_db.chat_logs.find_one({
                "room_id": self.room_id,
                "topic_id": self.topic_id
            })
            
            if chat_log:
                # Update existing chat log
                await self.mongo_db.chat_logs.update_one(
                    {"_id": chat_log["_id"]},
                    {
                        "$push": {"messages": chat_message.dict()},
                        "$set": {
                            "last_activity": datetime.utcnow(),
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            else:
                # Create new chat log
                new_chat_log = ChatLog(
                    room_id=self.room_id,
                    topic_id=self.topic_id,
                    messages=[chat_message],
                    is_active=True,
                    last_activity=datetime.utcnow()
                )
                await self.mongo_db.chat_logs.insert_one(new_chat_log.dict())
                
        except Exception as e:
            logger.error(f"Error saving message to database: {e}")
    
    async def get_ai_response(self, question: str) -> str:
        """Get AI response for a question"""
        try:
            # Import AI service
            from services.ai_service import ai_service
            
            # Get AI response using the AI service
            response = await ai_service.generate_group_chat_response(
                message=question,
                chat_history=[],  # Could be enhanced to include recent context
                room_id=self.room_id,
                user_id=self.user_id
            )
            
            return response.get("response", "Sorry, I couldn't generate a response at this time.")
            
        except Exception as e:
            logger.error(f"Error getting AI response: {e}")
            return "Sorry, I'm having trouble processing your request right now."
    
    async def send_error(self, error_message: str):
        """Send error message to the client"""
        try:
            error_data = {
                "type": "error",
                "message": error_message,
                "timestamp": datetime.utcnow().isoformat()
            }
            await self.websocket.send_text(json.dumps(error_data))
        except Exception as e:
            logger.error(f"Error sending error message: {e}")
    
    async def load_chat_history(self, limit: int = 50):
        """Load recent chat history"""
        try:
            if not self.mongo_db:
                logger.error("MongoDB connection not available")
                return
                
            chat_log = await self.mongo_db.chat_logs.find_one({
                "room_id": self.room_id,
                "topic_id": self.topic_id
            })
            
            if chat_log and chat_log.get("messages"):
                # Get recent messages
                recent_messages = chat_log["messages"][-limit:]
                
                # Decrypt messages
                decrypted_messages = []
                for msg in recent_messages:
                    try:
                        decrypted_content = manager.encryption_service.decrypt_message(msg["content"])
                        msg["content"] = decrypted_content
                        decrypted_messages.append(msg)
                    except Exception as e:
                        logger.error(f"Error decrypting message: {e}")
                        # Keep encrypted content if decryption fails
                        decrypted_messages.append(msg)
                
                # Send history to client
                history_data = {
                    "type": "chat_history",
                    "messages": decrypted_messages,
                    "timestamp": datetime.utcnow().isoformat()
                }
                await self.websocket.send_text(json.dumps(history_data))
                
        except Exception as e:
            logger.error(f"Error loading chat history: {e}")

async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    topic_id: str,
    token: str
):
    """WebSocket endpoint for chat functionality"""
    try:
        # Authenticate user
        user = await get_user_from_token(token)
        if not user:
            await websocket.close(code=4001, reason="Authentication failed")
            return
        
        # Connect to the chat
        chat_ws = ChatWebSocket(websocket, room_id, topic_id, user["id"])
        await manager.connect(websocket, room_id, topic_id, user["id"])
        
        # Load chat history
        await chat_ws.load_chat_history()
        
        try:
            while True:
                # Receive message
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Handle the message
                await chat_ws.handle_message(message_data)
                
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for user {user['id']}")
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
        finally:
            # Clean up connection
            manager.disconnect(room_id, topic_id, user["id"])
            
            # Notify other users
            await manager.broadcast_to_topic(
                room_id, topic_id, user["id"],
                {
                    "type": "user_left",
                    "user_id": user["id"],
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
    except Exception as e:
        logger.error(f"WebSocket endpoint error: {e}")
        try:
            await websocket.close(code=4000, reason="Internal server error")
        except:
            pass 