# api/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from middleware.auth_middleware import get_current_user
import jwt
from core.config import settings

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

@router.post("/login")
async def login(response: Response):
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