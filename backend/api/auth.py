from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from core.config import settings
import requests
import jwt
import secrets
from datetime import datetime, timedelta
from urllib.parse import urlencode
from models.postgresql.user import User as PGUser
from sqlalchemy.orm import Session
from core.database import get_db

router = APIRouter()

# JWT settings
JWT_SECRET = settings.SECRET_KEY
JWT_ALGORITHM = settings.ALGORITHM
JWT_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
SESSION_COOKIE_NAME = "airoom_session"

# Google OAuth endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

@router.get("/google/login")
def google_login():
    """Redirect user to Google OAuth consent screen"""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    # Properly encode URL parameters
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url)

@router.get("/google/callback")
def google_callback(request: Request, code: str = None, db: Session = Depends(get_db)):
    """Handle Google OAuth callback and create user session"""
    if not code:
        # Redirect to your frontend login page with error
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=missing_code")
    
    try:
        # Exchange code for tokens
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        token_resp = requests.post(GOOGLE_TOKEN_URL, data=data)
        if not token_resp.ok:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=token_exchange_failed")
        
        tokens = token_resp.json()
        access_token = tokens.get("access_token")
        
        if not access_token:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=missing_access_token")
        
        # Get user info from Google
        userinfo_resp = requests.get(
            GOOGLE_USERINFO_URL, 
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if not userinfo_resp.ok:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=userinfo_failed")
        
        userinfo = userinfo_resp.json()
        
        # FIXED: Save or update user in database
        user = db.query(PGUser).filter(
            (PGUser.google_id == userinfo.get("sub")) | 
            (PGUser.email == userinfo.get("email"))
        ).first()
        
        if not user:
            # Create new user
            user = PGUser(
                google_id=userinfo.get("sub"),
                email=userinfo.get("email"),
                name=userinfo.get("name"),
                picture=userinfo.get("picture")
            )
            db.add(user)
        else:
            # Update existing user
            user.google_id = userinfo.get("sub")
            user.name = userinfo.get("name")
            user.picture = userinfo.get("picture")
        
        db.commit()
        db.refresh(user)
        
        # Create JWT session token
        session_token = create_jwt(userinfo)
        
        # Redirect to dashboard with secure cookie
        response = RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard")
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=session_token,
            httponly=True,
            samesite='none',
            secure=True,
            expires=datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return response
        
    except Exception as e:
        # Log the error in production
        print(f"OAuth error: {str(e)}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=authentication_failed")

@router.get("/me")
def get_me(request: Request, db: Session = Depends(get_db)):
    """Get current authenticated user info from DB"""
    
    # Check both cookies and Authorization header
    token = None
    
    # Try to get token from cookie first
    if SESSION_COOKIE_NAME in request.cookies:
        token = request.cookies.get(SESSION_COOKIE_NAME)
    
    # If no cookie, try Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Decode JWT token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Handle different JWT payload structures
        user_data = payload.get("user") or payload
        
        # Extract user identifiers - handle both structures
        google_id = user_data.get("sub") or user_data.get("google_id")
        email = user_data.get("email")
        
        if not google_id and not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Query user from database
        query = db.query(PGUser)
        if google_id and email:
            user = query.filter(
                (PGUser.google_id == google_id) | (PGUser.email == email)
            ).first()
        elif google_id:
            user = query.filter(PGUser.google_id == google_id).first()
        else:
            user = query.filter(PGUser.email == email).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return user data
        return {
            "user": user.to_dict(),
            "authenticated": True
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session")

@router.post("/logout")
def logout(response: Response):
    """Logout user by clearing session cookie"""
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        samesite='none',
        secure=True
    )
    return response

def create_jwt(userinfo: dict) -> str:
    """Create JWT token with user information"""
    payload = {
        "user": {
            "sub": userinfo.get("sub"),
            "email": userinfo.get("email"),
            "name": userinfo.get("name"),
            "picture": userinfo.get("picture")
        },
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)