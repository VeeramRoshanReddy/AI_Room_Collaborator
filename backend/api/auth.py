# api/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from middleware.auth_middleware import get_current_user, get_optional_user
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
            "supabase_id": getattr(current_user, 'supabase_id', None),
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
                "supabase_id": getattr(current_user, 'supabase_id', None),
                "is_active": current_user.is_active
            }
        }
    else:
        return {"authenticated": False}

@router.post("/login")
async def login(response: Response):
    """Demo login endpoint - creates a session cookie"""
    # Dummy user for demonstration; replace with real auth logic
    user = {"id": "demo-user-id", "email": "demo@example.com"}
    jwt_token = jwt.encode(
        {"user": {"sub": user["id"], "email": user["email"]}},
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
    return {"message": "Login successful", "user": user}