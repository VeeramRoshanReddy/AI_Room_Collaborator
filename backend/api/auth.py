# api/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from middleware.auth_middleware import get_current_user, get_optional_user
from sqlalchemy.orm import Session
from core.database import get_db
from models.postgresql.user import User as PGUser
import jwt
from core.config import settings
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/me")
def get_me(current_user = Depends(get_current_user)):
    """Get current authenticated user info from JWT."""
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "picture": current_user.picture,
            "supabase_id": getattr(current_user, 'supabase_id', None),
            "google_id": getattr(current_user, 'google_id', None),
            "is_active": current_user.is_active,
            "created_at": current_user.created_at.isoformat() if hasattr(current_user, 'created_at') else None
        }
    }

@router.post("/logout")
async def logout(response: Response):
    """Logout user by clearing session cookie"""
    response.delete_cookie(
        key="airoom_session",
        path="/",
        samesite="none",
        secure=True
    )
    return {"message": "Logout successful"}

@router.get("/status")
def auth_status(current_user = Depends(get_optional_user)):
    """Check authentication status"""
    if current_user:
        return {
            "authenticated": True, 
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "name": current_user.name,
                "picture": current_user.picture,
                "supabase_id": getattr(current_user, 'supabase_id', None),
                "google_id": getattr(current_user, 'google_id', None),
                "is_active": current_user.is_active
            }
        }
    else:
        return {"authenticated": False}

@router.post("/login")
async def login(response: Response, db: Session = Depends(get_db)):
    """Demo login endpoint - creates a session cookie"""
    try:
        # Create or get a demo user from database
        demo_email = "demo@example.com"
        demo_user = db.query(PGUser).filter(PGUser.email == demo_email).first()
        
        if not demo_user:
            # Create demo user if doesn't exist
            demo_user = PGUser(
                email=demo_email,
                name="Demo User",
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            logger.info(f"Created demo user: {demo_user.email}")
        
        # Create JWT token with proper user data structure
        # Make sure this matches the structure expected in websocket_auth.py
        payload = {
            "user": {
                "sub": demo_user.id,  # Use actual user ID from database
                "email": demo_user.email,
                "name": demo_user.name
            },
            "exp": datetime.utcnow() + timedelta(days=7),  # Token expires in 7 days
            "iat": datetime.utcnow()
        }
        
        jwt_token = jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        
        response.set_cookie(
            key="airoom_session",
            value=jwt_token,
            httponly=True,
            samesite="none",
            secure=True,
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days in seconds
        )
        
        return {
            "message": "Login successful", 
            "user": {
                "id": demo_user.id,
                "email": demo_user.email,
                "name": demo_user.name,
                "picture": demo_user.picture,
                "is_active": demo_user.is_active
            }
        }
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Login failed"
        )