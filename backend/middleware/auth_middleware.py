from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from models.postgresql.user import User as PGUser
import jwt
from core.config import settings
import logging

logger = logging.getLogger(__name__)

SESSION_COOKIE_NAME = "airoom_session"
JWT_SECRET = settings.SECRET_KEY
JWT_ALGORITHM = settings.ALGORITHM

def get_current_user(request: Request, db: Session = Depends(get_db)) -> PGUser:
    """
    Dependency to get current authenticated user
    Can be used in any endpoint that requires authentication
    """
    # Get token from cookie or Authorization header
    token = None
    
    # Try cookie first
    if SESSION_COOKIE_NAME in request.cookies:
        token = request.cookies.get(SESSION_COOKIE_NAME)
    
    # Try Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        # Decode JWT
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Get user from database
        user = db.query(PGUser).filter(PGUser.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=401,
                detail="User account is disabled",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        return user
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"}
        )

def get_optional_user(request: Request, db: Session = Depends(get_db)) -> PGUser | None:
    """
    Dependency to get current user if authenticated, None otherwise
    Useful for endpoints that work with or without authentication
    """
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None