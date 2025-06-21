# api/user.py
from fastapi import APIRouter, Depends, HTTPException
from core.config import settings
from middleware.auth_middleware import get_current_user, get_optional_user, verify_admin_user
from models.postgresql.user import User as PGUser
from sqlalchemy.orm import Session
from core.database import get_db
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
async def user_root():
    """User API root endpoint"""
    return {"message": "User API v1.0", "status": "active"}

@router.get("/profile")
def get_user_profile(current_user: PGUser = Depends(get_current_user)):
    """Get current user's profile - requires authentication"""
    return {
        "user": current_user.to_dict(),
        "message": "Profile retrieved successfully"
    }

@router.put("/profile")
def update_user_profile(
    profile_data: dict,
    current_user: PGUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    try:
        # Only allow updating specific fields
        allowed_fields = ["name"]
        
        for field in allowed_fields:
            if field in profile_data:
                setattr(current_user, field, profile_data[field])
        
        db.commit()
        db.refresh(current_user)
        
        return {
            "user": current_user.to_dict(),
            "message": "Profile updated successfully"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Profile update error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@router.get("/public-info")
def get_public_info(current_user: PGUser = Depends(get_optional_user)):
    """Get info - works with or without authentication"""
    if current_user:
        return {
            "message": f"Hello {current_user.name}!",
            "authenticated": True,
            "user_id": current_user.id
        }
    else:
        return {
            "message": "Hello guest!",
            "authenticated": False
        }

@router.get("/admin/users")
def list_all_users(
    admin_user: PGUser = Depends(verify_admin_user),
    db: Session = Depends(get_db)
):
    """List all users - admin only"""
    try:
        users = db.query(PGUser).all()
        return {
            "users": [user.to_dict() for user in users],
            "total": len(users)
        }
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")

@router.put("/admin/users/{user_id}/status")
def update_user_status(
    user_id: int,
    status_data: dict,
    admin_user: PGUser = Depends(verify_admin_user),
    db: Session = Depends(get_db)
):
    """Update user status - admin only"""
    try:
        user = db.query(PGUser).filter(PGUser.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update allowed status fields
        if "is_active" in status_data:
            user.is_active = status_data["is_active"]
        if "is_admin" in status_data:
            user.is_admin = status_data["is_admin"]
        
        db.commit()
        db.refresh(user)
        
        return {
            "user": user.to_dict(),
            "message": "User status updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating user status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update user status")