# middleware/auth_middleware.py
from fastapi import HTTPException, Request, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Optional
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from models.postgresql.user import User as PGUser
import logging
import requests
from jose import jwt

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer(auto_error=False)

# JWT settings
JWT_SECRET = settings.SECRET_KEY
JWT_ALGORITHM = settings.ALGORITHM
SESSION_COOKIE_NAME = "airoom_session"

class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )

def extract_token_from_request(request: Request) -> Optional[str]:
    """Extract JWT token from cookie or Authorization header"""
    
    # Try cookie first (preferred for web app)
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        logger.debug("Token found in cookie")
        return token
    
    # Try Authorization header as fallback
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        logger.debug("Token found in Authorization header")
        return token
    
    return None

def decode_jwt_token(token: str) -> dict:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token expired")
        raise AuthenticationError("Session expired - please login again")
    except jwt.InvalidSignatureError:
        logger.warning("JWT invalid signature")
        raise AuthenticationError("Invalid session signature")
    except jwt.DecodeError:
        logger.warning("JWT decode error")
        raise AuthenticationError("Malformed session token")
    except Exception as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise AuthenticationError("Token validation failed")

def get_current_user(request: Request, db: Session = Depends(get_db)) -> PGUser:
    """
    Dependency to get current authenticated user (required authentication)
    Raises 401 if user is not authenticated
    """
    
    # Extract token from request
    token = extract_token_from_request(request)
    if not token:
        logger.warning("No authentication token provided")
        raise AuthenticationError("Authentication required")
    
    # Decode and validate token
    try:
        payload = decode_jwt_token(token)
        user_id = payload.get("user_id")
        
        if not user_id:
            logger.warning("No user_id in JWT payload")
            raise AuthenticationError("Invalid token - missing user ID")
        
        # Get user from database
        user = db.query(PGUser).filter(PGUser.id == user_id).first()
        if not user:
            logger.warning(f"User not found in database: {user_id}")
            raise AuthenticationError("User not found - please login again")
        
        if not user.is_active:
            logger.warning(f"Inactive user attempted access: {user.email}")
            raise AuthenticationError("Account is inactive")
        
        logger.debug(f"Authentication successful for user: {user.email}")
        return user
        
    except AuthenticationError:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise AuthenticationError("Authentication failed")

def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[PGUser]:
    """
    Dependency to get current user if authenticated (optional authentication)
    Returns None if user is not authenticated, doesn't raise errors
    """
    
    try:
        # Extract token from request
        token = extract_token_from_request(request)
        if not token:
            return None
        
        # Decode and validate token
        payload = decode_jwt_token(token)
        user_id = payload.get("user_id")
        
        if not user_id:
            return None
        
        # Get user from database
        user = db.query(PGUser).filter(PGUser.id == user_id).first()
        if not user or not user.is_active:
            return None
        
        logger.debug(f"Optional authentication successful for user: {user.email}")
        return user
        
    except Exception as e:
        logger.debug(f"Optional authentication failed: {str(e)}")
        return None

def verify_admin_user(current_user: PGUser = Depends(get_current_user)) -> PGUser:
    """
    Dependency to verify current user is admin
    """
    if not current_user.is_admin:
        logger.warning(f"Non-admin user attempted admin access: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user

def get_supabase_jwk():
    jwks_url = f"{settings.SUPABASE_URL}/auth/v1/keys"
    resp = requests.get(jwks_url)
    resp.raise_for_status()
    return resp.json()["keys"]

def verify_supabase_jwt(token: str):
    jwks = get_supabase_jwk()
    header = jwt.get_unverified_header(token)
    key = next((k for k in jwks if k["kid"] == header["kid"]), None)
    if not key:
        raise HTTPException(status_code=401, detail="Invalid Supabase JWT")
    return jwt.decode(token, key, algorithms=["RS256"], audience=None, options={"verify_aud": False})

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No auth token")
    token = auth_header.split(" ")[1]
    try:
        payload = verify_supabase_jwt(token)
        return payload  # contains user info
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")