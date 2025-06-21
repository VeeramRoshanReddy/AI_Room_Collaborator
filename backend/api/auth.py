from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
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
    # Add state parameter for security
    state = secrets.token_urlsafe(32)
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": state  # Add CSRF protection
    }
    
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    
    # Store state in session/cookie for verification in callback
    response = RedirectResponse(url)
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=True,
        samesite='lax',  # Changed from 'none' for better compatibility
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
    
    # Check for OAuth errors first
    if error:
        logger.error(f"OAuth error from Google: {error}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=oauth_denied")
    
    if not code:
        logger.error("Missing authorization code")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=missing_code")
    
    # Verify state parameter (CSRF protection)
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        logger.error("Invalid state parameter")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=invalid_state")
    
    try:
        # Exchange code for tokens
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        # Add timeout and better error handling
        token_resp = requests.post(
            GOOGLE_TOKEN_URL, 
            data=data,
            timeout=10,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if not token_resp.ok:
            logger.error(f"Token exchange failed: {token_resp.status_code} - {token_resp.text}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=token_exchange_failed")
        
        tokens = token_resp.json()
        access_token = tokens.get("access_token")
        
        if not access_token:
            logger.error("Missing access token in response")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=missing_access_token")
        
        # Get user info from Google
        userinfo_resp = requests.get(
            GOOGLE_USERINFO_URL, 
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )
        
        if not userinfo_resp.ok:
            logger.error(f"User info request failed: {userinfo_resp.status_code}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=userinfo_failed")
        
        userinfo = userinfo_resp.json()
        
        # Validate required fields
        if not userinfo.get("sub") or not userinfo.get("email"):
            logger.error("Missing required user info fields")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=incomplete_profile")
        
        # Save or update user in database
        try:
            user = db.query(PGUser).filter(
                (PGUser.google_id == userinfo.get("sub")) | 
                (PGUser.email == userinfo.get("email"))
            ).first()
            
            if not user:
                # Create new user
                user = PGUser(
                    google_id=userinfo.get("sub"),
                    email=userinfo.get("email"),
                    name=userinfo.get("name", ""),
                    picture=userinfo.get("picture", "")
                )
                db.add(user)
                logger.info(f"Created new user: {userinfo.get('email')}")
            else:
                # Update existing user
                user.google_id = userinfo.get("sub")
                user.name = userinfo.get("name", user.name)  # Keep existing if not provided
                user.picture = userinfo.get("picture", user.picture)
                logger.info(f"Updated existing user: {userinfo.get('email')}")
            
            db.commit()
            db.refresh(user)
            
        except Exception as db_error:
            db.rollback()
            logger.error(f"Database error: {str(db_error)}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=database_error")
        
        # Create JWT session token
        session_token = create_jwt(userinfo)
        
        # Create response and set cookies
        response = RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard")
        
        # Set session cookie
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=session_token,
            httponly=True,
            samesite='lax',  # Changed from 'none' for better compatibility
            secure=True,
            max_age=JWT_EXPIRE_MINUTES * 60,  # Convert minutes to seconds
            path="/"
        )
        
        # Clear the state cookie
        response.delete_cookie(
            key="oauth_state",
            path="/",
            secure=True,
            samesite='lax'
        )
        
        return response
        
    except requests.RequestException as req_error:
        logger.error(f"Request error: {str(req_error)}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=network_error")
    except Exception as e:
        logger.error(f"Unexpected OAuth error: {str(e)}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=authentication_failed")

@router.get("/debug")
def debug_auth(request: Request):
    """Debug endpoint to check authentication state"""
    return {
        "cookies": dict(request.cookies),
        "headers": dict(request.headers),
        "session_cookie_present": SESSION_COOKIE_NAME in request.cookies,
        "auth_header_present": "Authorization" in request.headers,
        "session_cookie_value": request.cookies.get(SESSION_COOKIE_NAME, "Not present")[:50] + "..." if request.cookies.get(SESSION_COOKIE_NAME) else "Not present"
    }

@router.get("/me")
def get_me(request: Request, db: Session = Depends(get_db)):
    """Get current authenticated user info from DB"""
    
    # Debug logging to see what we're receiving
    logger.info(f"Cookies received: {list(request.cookies.keys())}")
    logger.info(f"Authorization header: {request.headers.get('Authorization', 'None')}")
    
    # Check both cookies and Authorization header
    token = None
    
    # Try to get token from cookie first
    if SESSION_COOKIE_NAME in request.cookies:
        token = request.cookies.get(SESSION_COOKIE_NAME)
        logger.info(f"Token found in cookie: {token[:20]}..." if token else "No token in cookie")
    
    # If no cookie, try Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            logger.info(f"Token found in header: {token[:20]}..." if token else "No token in header")
    
    if not token:
        logger.error("No authentication token found")
        raise HTTPException(
            status_code=401, 
            detail="Not authenticated - no token found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        # Decode JWT token with better error handling
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            logger.info(f"JWT decoded successfully. Payload keys: {list(payload.keys())}")
        except jwt.ExpiredSignatureError:
            logger.error("JWT token expired")
            raise HTTPException(
                status_code=401, 
                detail="Session expired - please login again",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except jwt.InvalidSignatureError:
            logger.error("JWT invalid signature")
            raise HTTPException(
                status_code=401, 
                detail="Invalid session signature",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except jwt.DecodeError as e:
            logger.error(f"JWT decode error: {str(e)}")
            raise HTTPException(
                status_code=401, 
                detail="Malformed session token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Handle different JWT payload structures
        user_data = payload.get("user") or payload
        logger.info(f"User data keys: {list(user_data.keys())}")
        
        # Extract user identifiers - handle both structures
        google_id = user_data.get("sub") or user_data.get("google_id")
        email = user_data.get("email")
        
        logger.info(f"Extracted - Google ID: {google_id}, Email: {email}")
        
        if not google_id and not email:
            logger.error("No valid user identifiers in token")
            raise HTTPException(
                status_code=401, 
                detail="Invalid token - missing user identifiers",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Query user from database
        try:
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
                logger.error(f"User not found in database - Google ID: {google_id}, Email: {email}")
                raise HTTPException(
                    status_code=404, 
                    detail="User not found - please login again"
                )
            
            logger.info(f"User found: {user.email}")
            
            # Return user data
            return {
                "user": user.to_dict(),
                "authenticated": True
            }
            
        except HTTPException:
            raise  # Re-raise HTTP exceptions
        except Exception as db_error:
            logger.error(f"Database error in /me: {str(db_error)}")
            raise HTTPException(status_code=500, detail="Database error")
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Unexpected error in /me: {str(e)}")
        raise HTTPException(
            status_code=401, 
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"}
        )

@router.post("/logout")
def logout():
    """Logout user by clearing session cookie"""
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        samesite='lax',
        secure=True
    )
    return response

def create_jwt(userinfo: dict) -> str:
    """Create JWT token with user information"""
    # Use timezone-aware datetime
    now = datetime.now(timezone.utc)
    
    payload = {
        "user": {
            "sub": userinfo.get("sub"),
            "email": userinfo.get("email"),
            "name": userinfo.get("name", ""),
            "picture": userinfo.get("picture", "")
        },
        "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES),
        "iat": now,
        "iss": "airoom-app"  # Add issuer for better token validation
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)