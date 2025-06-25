# middleware/auth_middleware.py
from fastapi import HTTPException, Request, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Optional
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from models.postgresql.user import User as PGUser
import logging
import requests
from jose import jwt as jose_jwt
from jose.exceptions import JWTError, ExpiredSignatureError

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer(auto_error=False)

# JWT settings
JWT_SECRET = settings.SECRET_KEY
JWT_ALGORITHM = settings.ALGORITHM
SESSION_COOKIE_NAME = "airoom_session"

class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )

def get_supabase_jwks():
    """Fetch Supabase JWT signing keys"""
    try:
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/keys"
        resp = requests.get(jwks_url, timeout=5)
        resp.raise_for_status()
        return resp.json()["keys"]
    except Exception as e:
        logger.error(f"Failed to fetch Supabase JWKS: {str(e)}")
        raise AuthenticationError("Failed to validate token")

def verify_supabase_jwt(token: str) -> dict:
    """Verify and decode Supabase JWT token"""
    try:
        # Get the JWT header to find the key ID
        header = jose_jwt.get_unverified_header(token)
        kid = header.get("kid")
        
        if not kid:
            raise AuthenticationError("Invalid token format")
        
        # Get JWKS and find the matching key
        jwks = get_supabase_jwks()
        key = next((k for k in jwks if k["kid"] == kid), None)
        
        if not key:
            raise AuthenticationError("Invalid token signature")
        
        # Decode and verify the token
        payload = jose_jwt.decode(
            token, 
            key, 
            algorithms=["RS256"], 
            audience=None, 
            options={"verify_aud": False}
        )
        
        return payload
        
    except ExpiredSignatureError:
        logger.warning("Supabase JWT token expired")
        raise AuthenticationError("Session expired - please login again")
    except JWTError as e:
        logger.warning(f"Supabase JWT validation error: {str(e)}")
        raise AuthenticationError("Invalid session token")
    except Exception as e:
        logger.error(f"Supabase JWT verification error: {str(e)}")
        raise AuthenticationError("Token validation failed")

def verify_demo_jwt(token: str) -> dict:
    """Verify and decode demo JWT token (cookie-based)"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Demo JWT token expired")
        raise AuthenticationError("Session expired - please login again")
    except jwt.InvalidSignatureError:
        logger.warning("Demo JWT invalid signature")
        raise AuthenticationError("Invalid session signature")
    except jwt.DecodeError:
        logger.warning("Demo JWT decode error")
        raise AuthenticationError("Malformed session token")
    except Exception as e:
        logger.error(f"Demo JWT decode error: {str(e)}")
        raise AuthenticationError("Token validation failed")

def extract_token_from_request(request: Request) -> tuple[Optional[str], str]:
    """Extract token from request and return (token, token_type)"""
    
    # Try Authorization header first (Supabase)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        logger.debug("Token found in Authorization header (Supabase)")
        return token, "supabase"
    
    # Try cookie (demo login)
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        logger.debug("Token found in cookie (demo)")
        return token, "demo"
    
    return None, "none"

def get_current_user(request: Request, db: Session = Depends(get_db)):
    """
    Dependency to get current authenticated user
    Supports both Supabase JWT (Bearer token) and demo JWT (cookie)
    """
    
    # Extract token from request
    token, token_type = extract_token_from_request(request)
    if not token:
        logger.warning("No authentication token provided")
        raise AuthenticationError("Authentication required")
    
    try:
        if token_type == "supabase":
            # Handle Supabase JWT
            payload = verify_supabase_jwt(token)
            user_id = payload.get("sub")  # Supabase uses 'sub' for user ID
            user_email = payload.get("email")
            
            if not user_id:
                raise AuthenticationError("Invalid token - missing user ID")
            
            # For Supabase, create or get user from database
            user = db.query(PGUser).filter(PGUser.supabase_id == user_id).first()
            if not user:
                # Create new user if doesn't exist
                user_name = payload.get("user_metadata", {}).get("full_name") or payload.get("email", "").split("@")[0]
                user = PGUser(
                    supabase_id=user_id,
                    email=user_email,
                    name=user_name,
                    picture=payload.get("user_metadata", {}).get("avatar_url"),
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                logger.info(f"Created new user from Supabase: {user_email}")
            
        elif token_type == "demo":
            # Handle demo JWT
            payload = verify_demo_jwt(token)
            user_data = payload.get("user", {})
            user_id = user_data.get("sub")
            
            if not user_id:
                raise AuthenticationError("Invalid token - missing user ID")
            
            # For demo, get user from database
            user = db.query(PGUser).filter(PGUser.id == user_id).first()
            if not user:
                logger.warning(f"Demo user not found in database: {user_id}")
                raise AuthenticationError("User not found - please login again")
        
        else:
            raise AuthenticationError("Invalid token type")
        
        if not user.is_active:
            logger.warning(f"Inactive user attempted access: {user.email}")
            raise AuthenticationError("Account is inactive")
        
        logger.debug(f"Authentication successful for user: {user.email}")
        return user
        
    except AuthenticationError:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise AuthenticationError("Authentication failed")

def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[PGUser]:
    """
    Dependency to get current user if authenticated (optional authentication)
    Returns None if user is not authenticated, doesn't raise errors
    """
    
    try:
        return get_current_user(request, db)
    except Exception as e:
        logger.debug(f"Optional authentication failed: {str(e)}")
        return None

def verify_admin_user(current_user: PGUser = Depends(get_current_user)) -> PGUser:
    """
    Dependency to verify current user is admin
    """
    if not current_user.is_admin:
        logger.warning(f"Non-admin user attempted admin access: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user