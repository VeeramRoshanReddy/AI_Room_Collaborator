# api/auth.py
from fastapi import APIRouter, Request, HTTPException, status, Depends, Header
from fastapi.responses import RedirectResponse, JSONResponse
from core.config import settings
import requests
import jwt
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from models.postgresql.user import User as PGUser
from sqlalchemy.orm import Session
from core.database import get_db
from middleware.auth_middleware import get_optional_user
import logging
from jose import jwt, JWTError
from typing import Optional
from authlib.integrations.starlette_client import OAuth

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()
oauth = OAuth()

oauth.register(
    name='google',
    server_metadata_url=settings.GOOGLE_CONF_URL,
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    client_kwargs={'scope': 'openid email profile'}
)

# JWT settings
JWT_SECRET = settings.SECRET_KEY
JWT_ALGORITHM = settings.ALGORITHM
JWT_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
SESSION_COOKIE_NAME = "airoom_session"

# Google OAuth endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

def create_jwt_token(user: PGUser) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(user.google_id)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user_from_token(
    authorization: Optional[str] = Header(None), 
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token not provided")
    
    token = authorization.split(" ")[1]
    credentials_exception = HTTPException(
        status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        google_id: str = payload.get("sub")
        if google_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(PGUser).filter(PGUser.google_id == google_id).first()
    if user is None:
        raise credentials_exception
    return user

@router.get("/google/login")
async def login_via_google(request: Request):
    redirect_uri = f"{settings.API_URL}/api/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def auth_via_google(request: Request, db: Session = Depends(get_db)):
    try:
        token_data = await oauth.google.authorize_access_token(request)
        user_info = token_data.get('userinfo')
        
        if not user_info or not user_info.get('sub'):
            raise HTTPException(status_code=400, detail="Invalid user info from Google")

        user = db.query(PGUser).filter(PGUser.google_id == user_info['sub']).first()
        if not user:
            user = PGUser(
                google_id=user_info['sub'], email=user_info['email'],
                name=user_info['name'], picture=user_info['picture']
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        session_token = create_jwt_token(user)
        frontend_url = settings.FRONTEND_URL
        return RedirectResponse(url=f"{frontend_url}/auth/callback?token={session_token}")

    except Exception as e:
        logger.error(f"Error in Google OAuth callback: {e}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=auth_failed")

@router.get("/me")
def get_me(current_user: PGUser = Depends(get_current_user_from_token)):
    """Get current authenticated user info from token."""
    return {"user": current_user}

@router.post("/logout")
async def logout():
    # On the frontend, the token will be deleted from localStorage.
    # This endpoint is for any server-side session invalidation if needed in the future.
    return {"message": "Logout successful"}

@router.get("/status")
def auth_status(current_user: PGUser = Depends(get_optional_user)):
    """Check authentication status (optional auth)"""
    if current_user:
        return {
            "authenticated": True,
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "name": current_user.name
            }
        }
    else:
        return {"authenticated": False}