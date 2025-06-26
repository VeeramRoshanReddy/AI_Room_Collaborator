from fastapi import WebSocket
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_token
from models.postgresql.user import User as PGUser
import asyncio

class WebSocketAuthenticationError(Exception):
    def __init__(self, reason: str):
        self.reason = reason
        super().__init__(reason)

async def get_websocket_user(websocket: WebSocket, db: Session = None):
    """Authenticate user for websocket connection. Returns user or raises WebSocketAuthenticationError."""
    # Try to get token from query params
    token = websocket.query_params.get("token")
    if not token:
        # Try to get token from headers
        auth_header = websocket.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
    if not token:
        raise WebSocketAuthenticationError("Missing authentication token")
    payload = verify_token(token)
    if not payload:
        raise WebSocketAuthenticationError("Invalid or expired token")
    user_id = payload.get("sub")
    if not user_id:
        raise WebSocketAuthenticationError("Invalid token payload")
    # Use provided db or create a new one
    close_db = False
    if db is None:
        db = next(get_db())
        close_db = True
    try:
        user = db.query(PGUser).filter(PGUser.id == user_id).first()
        if not user:
            raise WebSocketAuthenticationError("User not found")
        if not user.is_active:
            raise WebSocketAuthenticationError("Account is deactivated")
        return user
    finally:
        if close_db:
            db.close()

async def get_user_from_token(token: str, db: Session = None):
    """Verify a JWT token and return the user information as a dictionary, or None if invalid."""
    try:
        payload = verify_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        close_db = False
        if db is None:
            db = next(get_db())
            close_db = True
        
        try:
            user = db.query(PGUser).filter(PGUser.id == user_id).first()
            if not user or not user.is_active:
                return None
            
            # Return user information as dictionary
            return {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "picture": user.picture
            }
        finally:
            if close_db:
                db.close()
    except Exception as e:
        return None 