# middleware/websocket_auth.py
from fastapi import WebSocket, WebSocketException, status, Query
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from models.postgresql.user import User as PGUser
import jwt
from jose import jwt as jose_jwt
from jose.exceptions import JWTError, ExpiredSignatureError
import logging
import requests
from typing import Optional
from urllib.parse import parse_qs

logger = logging.getLogger(__name__)

class WebSocketAuthenticationError(WebSocketException):
    def __init__(self, code: int = status.WS_1008_POLICY_VIOLATION, reason: str = "Authentication failed"):
        super().__init__(code=code, reason=reason)

def get_supabase_jwks():
    """Fetch Supabase JWT signing keys"""
    try:
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/keys"
        resp = requests.get(jwks_url, timeout=5)
        resp.raise_for_status()
        return resp.json()["keys"]
    except Exception as e:
        logger.error(f"Failed to fetch Supabase JWKS: {str(e)}")
        raise WebSocketAuthenticationError(reason="Failed to validate token")

def verify_supabase_jwt(token: str) -> dict:
    """Verify and decode Supabase JWT token"""
    try:
        # Get the JWT header to find the key ID
        header = jose_jwt.get_unverified_header(token)
        kid = header.get("kid")
        
        if not kid:
            raise WebSocketAuthenticationError(reason="Invalid token format")
        
        # Get JWKS and find the matching key
        jwks = get_supabase_jwks()
        key = next((k for k in jwks if k["kid"] == kid), None)
        
        if not key:
            raise WebSocketAuthenticationError(reason="Invalid token signature")
        
        # Decode and verify the token
        payload = jose_jwt.decode(
            token, 
            key, 
            algorithms=["RS256"], 
            audience=None, 
            options={"verify_aud": False}
        )
        
        return payload
        
    except ExpiredSignatureError:
        logger.warning("Supabase JWT token expired")
        raise WebSocketAuthenticationError(reason="Session expired")
    except JWTError as e:
        logger.warning(f"Supabase JWT validation error: {str(e)}")
        raise WebSocketAuthenticationError(reason="Invalid session token")
    except Exception as e:
        logger.error(f"Supabase JWT verification error: {str(e)}")
        raise WebSocketAuthenticationError(reason="Token validation failed")

def verify_demo_jwt(token: str) -> dict:
    """Verify and decode demo JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Demo JWT token expired")
        raise WebSocketAuthenticationError(reason="Session expired")
    except jwt.InvalidSignatureError:
        logger.warning("Demo JWT invalid signature")
        raise WebSocketAuthenticationError(reason="Invalid session signature")
    except jwt.DecodeError:
        logger.warning("Demo JWT decode error")
        raise WebSocketAuthenticationError(reason="Malformed session token")
    except Exception as e:
        logger.error(f"Demo JWT decode error: {str(e)}")
        raise WebSocketAuthenticationError(reason="Token validation failed")

def extract_token_from_websocket(websocket: WebSocket) -> tuple[Optional[str], str]:
    """Extract token from WebSocket connection"""
    
    # Try Authorization header first
    auth_header = websocket.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        logger.debug("Token found in WebSocket Authorization header (Supabase)")
        return token, "supabase"
    
    # Try query parameters
    query_params = parse_qs(websocket.url.query)
    
    # Check for token in query params
    if "token" in query_params:
        token = query_params["token"][0]
        logger.debug("Token found in WebSocket query params (Supabase)")
        return token, "supabase"
    
    # Check for cookie token in query params (since WebSocket doesn't support cookies directly)
    if "cookie_token" in query_params:
        token = query_params["cookie_token"][0]
        logger.debug("Cookie token found in WebSocket query params (demo)")
        return token, "demo"
    
    # Try cookies (some browsers/clients might support this)
    cookie_header = websocket.headers.get("Cookie")
    if cookie_header:
        cookies = {}
        for cookie in cookie_header.split(';'):
            if '=' in cookie:
                key, value = cookie.strip().split('=', 1)
                cookies[key] = value
        
        if "airoom_session" in cookies:
            token = cookies["airoom_session"]
            logger.debug("Token found in WebSocket cookie (demo)")
            return token, "demo"
    
    return None, "none"

async def get_websocket_user(websocket: WebSocket, db: Session) -> PGUser:
    """
    Get authenticated user from WebSocket connection
    Supports both Supabase JWT and demo JWT authentication
    """
    
    # Extract token from WebSocket
    token, token_type = extract_token_from_websocket(websocket)
    if not token:
        logger.warning("No authentication token provided in WebSocket")
        raise WebSocketAuthenticationError(reason="Authentication required")
    
    try:
        if token_type == "supabase":
            # Handle Supabase JWT
            payload = verify_supabase_jwt(token)
            user_id = payload.get("sub")
            user_email = payload.get("email")
            
            if not user_id:
                raise WebSocketAuthenticationError(reason="Invalid token - missing user ID")
            
            # For Supabase, create or get user from database
            user = db.query(PGUser).filter(PGUser.supabase_id == user_id).first()
            if not user:
                # Create new user if doesn't exist
                user_name = payload.get("user_metadata", {}).get("full_name") or payload.get("email", "").split("@")[0]
                user = PGUser(
                    supabase_id=user_id,
                    email=user_email,
                    name=user_name,
                    picture=payload.get("user_metadata", {}).get("avatar_url"),
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                logger.info(f"Created new user from Supabase: {user_email}")
            
        elif token_type == "demo":
            # Handle demo JWT
            payload = verify_demo_jwt(token)
            user_data = payload.get("user", {})
            user_id = user_data.get("sub")
            
            if not user_id:
                raise WebSocketAuthenticationError(reason="Invalid token - missing user ID")
            
            # For demo, get user from database
            user = db.query(PGUser).filter(PGUser.id == user_id).first()
            if not user:
                logger.warning(f"Demo user not found in database: {user_id}")
                raise WebSocketAuthenticationError(reason="User not found")
        
        else:
            raise WebSocketAuthenticationError(reason="Invalid token type")
        
        if not user.is_active:
            logger.warning(f"Inactive user attempted WebSocket access: {user.email}")
            raise WebSocketAuthenticationError(reason="Account is inactive")
        
        logger.debug(f"WebSocket authentication successful for user: {user.email}")
        return user
        
    except WebSocketAuthenticationError:
        raise
    except Exception as e:
        logger.error(f"WebSocket authentication error: {str(e)}")
        raise WebSocketAuthenticationError(reason="Authentication failed")