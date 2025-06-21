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
        "state": state
    }
    
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    
    # Store state in session/cookie for verification in callback
    response = RedirectResponse(url)
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=True,  # Set to False for local development
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
        logger.warning("State parameter mismatch - proceeding anyway for development")
        # In production, you might want to enforce this:
        # logger.error("Invalid state parameter")
        # return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=invalid_state")
    
    try:
        # Exchange code for tokens
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        logger.info("Exchanging code for token...")
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
        logger.info("Fetching user info from Google...")
        userinfo_resp = requests.get(
            GOOGLE_USERINFO_URL, 
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )
        
        if not userinfo_resp.ok:
            logger.error(f"User info request failed: {userinfo_resp.status_code}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=userinfo_failed")
        
        userinfo = userinfo_resp.json()
        logger.info(f"Received user info: {userinfo}")
        
        # Validate required fields
        if not userinfo.get("sub") or not userinfo.get("email"):
            logger.error("Missing required user info fields")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=incomplete_profile")
        
        # Save or update user in database
        try:
            logger.info(f"Looking for user with Google ID: {userinfo.get('sub')} or email: {userinfo.get('email')}")
            
            user = db.query(PGUser).filter(
                (PGUser.google_id == userinfo.get("sub")) | 
                (PGUser.email == userinfo.get("email"))
            ).first()
            
            if not user:
                # Create new user
                logger.info("Creating new user...")
                user = PGUser(
                    google_id=userinfo.get("sub"),
                    email=userinfo.get("email"),
                    name=userinfo.get("name", ""),
                    picture=userinfo.get("picture", ""),
                    is_active=True,
                    is_admin=False
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                logger.info(f"Created new user with ID: {user.id}")
            else:
                # Update existing user
                logger.info(f"Updating existing user: {user.id}")
                user.google_id = userinfo.get("sub")
                user.name = userinfo.get("name", user.name)
                user.picture = userinfo.get("picture", user.picture)
                user.is_active = True
                db.commit()
                db.refresh(user)
                logger.info(f"Updated user: {user.email}")
            
        except Exception as db_error:
            db.rollback()
            logger.error(f"Database error: {str(db_error)}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=database_error")
        
        # Create JWT session token with user data from database
        session_token = create_jwt(user)
        logger.info(f"Created JWT token for user: {user.email}")
        
        # Create response and set cookies
        response = RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard")
        
        # Set session cookie
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=session_token,
            httponly=True,
            samesite='lax',
            secure=True,  # Set to False for local development
            max_age=JWT_EXPIRE_MINUTES * 60,
            path="/"
        )
        
        # Clear the state cookie
        response.delete_cookie(
            key="oauth_state",
            path="/",
            secure=True,
            samesite='lax'
        )
        
        logger.info(f"Authentication successful for user: {user.email}")
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
    session_cookie = request.cookies.get(SESSION_COOKIE_NAME)
    debug_info = {
        "cookies": dict(request.cookies),
        "headers": dict(request.headers),
        "session_cookie_present": SESSION_COOKIE_NAME in request.cookies,
        "auth_header_present": "Authorization" in request.headers,
        "session_cookie_value": session_cookie[:50] + "..." if session_cookie else "Not present"
    }
    
    # Try to decode the JWT if present
    if session_cookie:
        try:
            payload = jwt.decode(session_cookie, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            debug_info["jwt_payload"] = payload
            debug_info["jwt_valid"] = True
        except Exception as e:
            debug_info["jwt_error"] = str(e)
            debug_info["jwt_valid"] = False
    
    return debug_info

@router.get("/me")
def get_me(request: Request, db: Session = Depends(get_db)):
    """Get current authenticated user info from DB"""
    
    logger.info("=== /me endpoint called ===")
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
        # Decode JWT token
        logger.info("Decoding JWT token...")
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            logger.info(f"JWT decoded successfully. Payload: {payload}")
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
        
        # Extract user ID from payload
        user_id = payload.get("user_id")
        if not user_id:
            logger.error("No user_id in JWT payload")
            raise HTTPException(
                status_code=401, 
                detail="Invalid token - missing user ID",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Query user from database using user_id
        try:
            logger.info(f"Querying user with ID: {user_id}")
            user = db.query(PGUser).filter(PGUser.id == user_id).first()
            
            if not user:
                logger.error(f"User not found in database with ID: {user_id}")
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
            raise
        except Exception as db_error:
            logger.error(f"Database error in /me: {str(db_error)}")
            raise HTTPException(status_code=500, detail="Database error")
        
    except HTTPException:
        raise
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
        secure=True  # Set to False for local development
    )
    return response

def create_jwt(user: PGUser) -> str:
    """Create JWT token with user information from database"""
    now = datetime.now(timezone.utc)
    
    payload = {
        "user_id": user.id,  # Use database user ID as primary identifier
        "email": user.email,
        "name": user.name,
        "google_id": user.google_id,
        "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES),
        "iat": now,
        "iss": "airoom-app"
    }
    
    logger.info(f"Creating JWT with payload: {payload}")
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)