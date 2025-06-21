# api/auth.py
from fastapi import APIRouter, Request, HTTPException, status, Depends
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
from middleware.auth_middleware import get_current_user, get_optional_user
import logging

# Set up logging
logger = logging.getLogger(__name__)

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
    # Generate state parameter for CSRF protection
    state = secrets.token_urlsafe(32)
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": state
    }
    
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    
    # Create redirect response with state cookie
    response = RedirectResponse(url)
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=True,  # Always True for production
        samesite='lax',
        max_age=600  # 10 minutes
    )
    
    return response

@router.get("/google/callback")
def google_callback(
    request: Request, 
    code: str = None, 
    state: str = None,
    error: str = None,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback and create user session"""
    
    # Check for OAuth errors
    if error:
        logger.error(f"OAuth error from Google: {error}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=oauth_denied")
    
    if not code:
        logger.error("Missing authorization code")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=missing_code")
    
    # Verify state parameter for CSRF protection
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        logger.error("Invalid state parameter - possible CSRF attack")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=invalid_state")
    
    try:
        # Exchange authorization code for tokens
        token_data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        logger.info("Exchanging authorization code for access token")
        token_response = requests.post(
            GOOGLE_TOKEN_URL, 
            data=token_data,
            timeout=30,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if not token_response.ok:
            logger.error(f"Token exchange failed: {token_response.status_code} - {token_response.text}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=token_exchange_failed")
        
        tokens = token_response.json()
        access_token = tokens.get("access_token")
        
        if not access_token:
            logger.error("No access token in response")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=missing_access_token")
        
        # Get user information from Google
        logger.info("Fetching user info from Google")
        userinfo_response = requests.get(
            GOOGLE_USERINFO_URL, 
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=30
        )
        
        if not userinfo_response.ok:
            logger.error(f"Failed to fetch user info: {userinfo_response.status_code}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=userinfo_failed")
        
        userinfo = userinfo_response.json()
        
        # Validate required user information
        google_id = userinfo.get("sub")
        email = userinfo.get("email")
        
        if not google_id or not email:
            logger.error("Incomplete user profile from Google")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=incomplete_profile")
        
        # Create or update user in database
        try:
            user = db.query(PGUser).filter(
                (PGUser.google_id == google_id) | (PGUser.email == email)
            ).first()
            
            if user:
                # Update existing user
                logger.info(f"Updating existing user: {email}")
                user.google_id = google_id
                user.name = userinfo.get("name", user.name)
                user.picture = userinfo.get("picture", user.picture)
                user.is_active = True
            else:
                # Create new user
                logger.info(f"Creating new user: {email}")
                user = PGUser(
                    google_id=google_id,
                    email=email,
                    name=userinfo.get("name", ""),
                    picture=userinfo.get("picture", ""),
                    is_active=True,
                    is_admin=False
                )
                db.add(user)
            
            db.commit()
            db.refresh(user)
            logger.info(f"User saved successfully: {user.email} (ID: {user.id})")
            
        except Exception as db_error:
            db.rollback()
            logger.error(f"Database error: {str(db_error)}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=database_error")
        
        # Create JWT session token
        token = create_jwt_token(user)
        
        # This is the final step. The user is authenticated.
        # Redirect them back to the frontend to complete the login flow.
        frontend_url = settings.FRONTEND_URL 
        response = RedirectResponse(url=f"{frontend_url}/login?success=true")
        
        # Set the secure, HttpOnly cookie containing the JWT
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=token,
            httponly=True,
            samesite='none',
            secure=True, 
            expires=datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # Clear state cookie
        response.delete_cookie(
            key="oauth_state",
            path="/",
            secure=True,
            samesite='lax'
        )
        
        logger.info(f"Authentication successful for user: {user.email}")
        return response
        
    except requests.RequestException as e:
        logger.error(f"Network error during authentication: {str(e)}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=network_error")
    except Exception as e:
        logger.error(f"Unexpected error during authentication: {str(e)}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=authentication_failed")

@router.get("/me")
def get_current_user_info(current_user: PGUser = Depends(get_current_user)):
    """Get current authenticated user information"""
    return {
        "user": current_user.to_dict(),
        "authenticated": True
    }

@router.post("/logout")
def logout():
    """Logout user by clearing session cookie"""
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        secure=True,
        samesite='lax'
    )
    return response

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

def create_jwt_token(user: PGUser) -> str:
    """Create JWT token with user information"""
    now = datetime.now(timezone.utc)
    
    payload = {
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "google_id": user.google_id,
        "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES),
        "iat": now,
        "iss": "airoom-app"
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)