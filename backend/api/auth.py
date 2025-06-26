# api/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from middleware.auth_middleware import get_current_user, get_optional_user
from sqlalchemy.orm import Session
from core.database import get_db
from models.postgresql.user import User as PGUser
import jwt
from core.config import settings
from datetime import datetime, timedelta
import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# Google OAuth2 configuration
GOOGLE_OAUTH2_CLIENT_ID = settings.GOOGLE_OAUTH2_CLIENT_ID
GOOGLE_OAUTH2_CLIENT_SECRET = settings.GOOGLE_OAUTH2_CLIENT_SECRET
GOOGLE_OAUTH2_REDIRECT_URI = f"{settings.FRONTEND_URL}/auth/callback"

def create_jwt_token(user: PGUser) -> str:
    """Create JWT token for user"""
    payload = {
        "sub": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow()
    }
    
    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

def verify_google_token(id_token: str) -> Optional[dict]:
    """Verify Google ID token and return user info"""
    try:
        # Verify the token with Google
        response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        )
        
        if response.status_code != 200:
            return None
        
        token_info = response.json()
        
        # Verify the token is for our app
        if token_info.get("aud") != GOOGLE_OAUTH2_CLIENT_ID:
            return None
        
        return {
            "email": token_info.get("email"),
            "name": token_info.get("name"),
            "picture": token_info.get("picture"),
            "google_id": token_info.get("sub")
        }
    except Exception as e:
        logger.error(f"Error verifying Google token: {e}")
        return None

@router.get("/google/url")
async def get_google_auth_url():
    """Get Google OAuth2 authorization URL"""
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_OAUTH2_CLIENT_ID}&"
        "response_type=code&"
        "scope=openid email profile&"
        f"redirect_uri={GOOGLE_OAUTH2_REDIRECT_URI}&"
        "access_type=offline"
    )
    return {"auth_url": auth_url}

@router.post("/google/callback")
async def google_auth_callback(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth2 callback"""
    try:
        body = await request.json()
        code = body.get("code")
        
        if not code:
            raise HTTPException(status_code=400, detail="Authorization code required")
        
        # Exchange code for tokens
        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_OAUTH2_CLIENT_ID,
                "client_secret": GOOGLE_OAUTH2_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": GOOGLE_OAUTH2_REDIRECT_URI
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for tokens")
        
        token_data = token_response.json()
        id_token = token_data.get("id_token")
        
        if not id_token:
            raise HTTPException(status_code=400, detail="No ID token received")
        
        # Verify and decode the ID token
        user_info = verify_google_token(id_token)
        if not user_info:
            raise HTTPException(status_code=400, detail="Invalid Google token")
        
        # Get or create user
        user, is_new = PGUser.get_or_create_user(
            email=user_info["email"],
            name=user_info["name"],
            picture=user_info["picture"],
            google_id=user_info["google_id"],
            db=db
        )
        
        # Create JWT token
        jwt_token = create_jwt_token(user)
        
        # Set secure cookie
        response.set_cookie(
            key="airoom_session",
            value=jwt_token,
            httponly=True,
            samesite="none",
            secure=True,
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        return {
            "message": "Login successful",
            "user": user.to_dict(),
            "is_new_user": is_new,
            "token": jwt_token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth callback error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@router.post("/google/token")
async def google_token_auth(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Handle Google token-based authentication (for mobile apps)"""
    try:
        body = await request.json()
        id_token = body.get("id_token")
        
        if not id_token:
            raise HTTPException(status_code=400, detail="ID token required")
        
        # Verify the Google ID token
        user_info = verify_google_token(id_token)
        if not user_info:
            raise HTTPException(status_code=400, detail="Invalid Google token")
        
        # Get or create user
        user, is_new = PGUser.get_or_create_user(
            email=user_info["email"],
            name=user_info["name"],
            picture=user_info["picture"],
            google_id=user_info["google_id"],
            db=db
        )
        
        # Create JWT token
        jwt_token = create_jwt_token(user)
        
        # Set secure cookie
        response.set_cookie(
            key="airoom_session",
            value=jwt_token,
            httponly=True,
            samesite="none",
            secure=True,
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        return {
            "message": "Login successful",
            "user": user.to_dict(),
            "is_new_user": is_new,
            "token": jwt_token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google token auth error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@router.get("/me")
def get_me(current_user: PGUser = Depends(get_current_user)):
    """Get current authenticated user info"""
    return {
        "user": current_user.to_dict()
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
def auth_status(current_user: PGUser = Depends(get_optional_user)):
    """Check authentication status"""
    if current_user:
        return {
            "authenticated": True,
            "user": current_user.to_dict()
        }
    else:
        return {"authenticated": False}