# api/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from middleware.auth_middleware import get_current_user, get_optional_user
from sqlalchemy.orm import Session
from core.database import get_db
from models.postgresql.user import User as PGUser
import jwt
from core.config import settings

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
    
    # Create JWT token with proper user data
    jwt_token = jwt.encode(
        {
            "user": {
                "sub": demo_user.id,  # Use actual user ID from database
                "email": demo_user.email,
                "name": demo_user.name
            }
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    response.set_cookie(
        key="airoom_session",
        value=jwt_token,
        httponly=True,
        samesite="none",
        secure=True,
        path="/"
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