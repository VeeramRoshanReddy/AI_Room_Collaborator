from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time chat"""
    
    def __init__(self):
        # Store active connections by room_id
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Store user info for each connection
        self.connection_users: Dict[WebSocket, dict] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str, user: dict):
        """Connect a user to a room"""
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
        
        self.active_connections[room_id].add(websocket)
        self.connection_users[websocket] = {
            "user": user,
            "room_id": room_id,
            "connected_at": datetime.utcnow()
        }
        
        logger.info(f"User {user.get('email', 'unknown')} connected to room {room_id}")
        
        # Send connection message to room
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "user": user,
            "timestamp": datetime.utcnow().isoformat()
        }, exclude_websocket=websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Disconnect a user from a room"""
        user_info = self.connection_users.get(websocket)
        if user_info:
            room_id = user_info["room_id"]
            user = user_info["user"]
            
            if room_id in self.active_connections:
                self.active_connections[room_id].discard(websocket)
                
                # Remove room if no connections left
                if not self.active_connections[room_id]:
                    del self.active_connections[room_id]
            
            del self.connection_users[websocket]
            
            logger.info(f"User {user.get('email', 'unknown')} disconnected from room {room_id}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific user"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude_websocket: WebSocket = None):
        """Broadcast a message to all users in a room"""
        if room_id not in self.active_connections:
            return
        
        disconnected_websockets = set()
        
        for websocket in self.active_connections[room_id]:
            if websocket != exclude_websocket:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error broadcasting message: {e}")
                    disconnected_websockets.add(websocket)
        
        # Clean up disconnected websockets
        for websocket in disconnected_websockets:
            self.disconnect(websocket)
    
    async def broadcast_chat_message(self, room_id: str, message: dict):
        """Broadcast a chat message to all users in a room"""
        chat_message = {
            "type": "chat_message",
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_room(room_id, chat_message)
    
    def get_room_users(self, room_id: str) -> List[dict]:
        """Get list of users currently in a room"""
        users = []
        if room_id in self.active_connections:
            for websocket in self.active_connections[room_id]:
                user_info = self.connection_users.get(websocket)
                if user_info:
                    users.append(user_info["user"])
        return users
    
    def get_user_count(self, room_id: str) -> int:
        """Get number of users in a room"""
        if room_id in self.active_connections:
            return len(self.active_connections[room_id])
        return 0

# Global connection manager instance
manager = ConnectionManager()

async def handle_websocket_connection(websocket: WebSocket, room_id: str, user: dict):
    """Handle WebSocket connection lifecycle"""
    await manager.connect(websocket, room_id, user)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle different message types
            message_type = message_data.get("type")
            
            if message_type == "chat_message":
                # Broadcast chat message to room
                await manager.broadcast_chat_message(room_id, {
                    "user": user,
                    "content": message_data.get("content", ""),
                    "message_id": message_data.get("message_id")
                })
            
            elif message_type == "typing":
                # Broadcast typing indicator
                await manager.broadcast_to_room(room_id, {
                    "type": "user_typing",
                    "user": user,
                    "is_typing": message_data.get("is_typing", False)
                }, exclude_websocket=websocket)
            
            elif message_type == "ping":
                # Respond to ping with pong
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }, websocket)
    
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)
        
        # Notify other users about disconnection
        await manager.broadcast_to_room(room_id, {
            "type": "user_left",
            "user": user,
            "timestamp": datetime.utcnow().isoformat()
        }) 