# api/user.py
from fastapi import APIRouter, Depends, HTTPException
from core.config import settings
from middleware.auth_middleware import get_current_user, get_optional_user
from models.postgresql.user import User as PGUser

router = APIRouter()

@router.get("/")
async def user_root():
    return {"message": "User API"}

@router.get("/profile")
def get_user_profile(current_user: PGUser = Depends(get_current_user)):
    """Get current user's profile - requires authentication"""
    return {
        "user": current_user.to_dict(),
        "message": "Profile retrieved successfully"
    }

@router.get("/public-info")
def get_public_info(current_user: PGUser = Depends(get_optional_user)):
    """Get info - works with or without authentication"""
    if current_user:
        return {"message": f"Hello {current_user.name}!", "authenticated": True}
    else:
        return {"message": "Hello guest!", "authenticated": False}