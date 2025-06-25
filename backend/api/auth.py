# api/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request
from middleware.auth_middleware import get_current_user

router = APIRouter()

@router.get("/me")
def get_me(current_user = Depends(get_current_user)):
    """Get current authenticated user info from JWT."""
    return {"user": current_user}

@router.post("/logout")
async def logout():
    return {"message": "Logout successful"}

@router.get("/status")
def auth_status(current_user = Depends(get_current_user)):
    if current_user:
        return {"authenticated": True, "user": current_user}
    else:
        return {"authenticated": False}