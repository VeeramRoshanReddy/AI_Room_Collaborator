# middleware/auth_middleware.py
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from models.postgresql.user import User as PGUser
import jwt
from jose import jwt as jose_jwt
from jose.exceptions import JWTError, ExpiredSignatureError
import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme for Supabase
security = HTTPBearer(auto_error=False)

def get_supabase_jwks():
    """Fetch Supabase JWT signing keys"""
    try:
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/keys"
        resp = requests.get(jwks_url, timeout=5)
        resp.raise_for_status()
        return resp.json()["keys"]
    except Exception as e:
        logger.error(f"Failed to fetch Supabase JWKS: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to validate token"
        )

def verify_supabase_jwt(token: str) -> dict:
    """Verify and decode Supabase JWT token"""
    try:
        # Get the JWT header to find the key ID
        header = jose_jwt.get_unverified_header(token)
        kid = header.get("kid")
        
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format"
            )
        
        # Get JWKS and find the matching key
        jwks = get_supabase_jwks()
        key = next((k for k in jwks if k["kid"] == kid), None)
        
        if not key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token signature"
            )
        
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )
    except JWTError as e:
        logger.warning(f"Supabase JWT validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token"
        )
    except Exception as e:
        logger.error(f"Supabase JWT verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed"
        )

def verify_demo_jwt(token: str) -> dict:
    """Verify and decode demo JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Demo JWT token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )
    except jwt.InvalidSignatureError:
        logger.warning("Demo JWT invalid signature")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session signature"
        )
    except jwt.DecodeError:
        logger.warning("Demo JWT decode error")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed session token"
        )
    except Exception as e:
        logger.error(f"Demo JWT decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed"
        )

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> PGUser:
    """
    Get current authenticated user from JWT token
    Supports both Supabase JWT (Bearer token) and demo JWT (cookie)
    """
    token = None
    token_type = None
    
    # Try Authorization header first (Supabase)
    if credentials:
        token = credentials.credentials
        token_type = "supabase"
        logger.debug("Token found in Authorization header (Supabase)")
    
    # Try cookie if no Bearer token (demo)
    if not token:
        token = request.cookies.get("airoom_session")
        if token:
            token_type = "demo"
            logger.debug("Token found in cookie (demo)")
    
    if not token:
        logger.warning("No authentication token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        if token_type == "supabase":
            # Handle Supabase JWT
            payload = verify_supabase_jwt(token)
            user_id = payload.get("sub")
            user_email = payload.get("email")
            
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token - missing user ID"
                )
            
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
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token - missing user ID"
                )
            
            # For demo, get user from database
            user = db.query(PGUser).filter(PGUser.id == user_id).first()
            if not user:
                logger.warning(f"Demo user not found in database: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        if not user.is_active:
            logger.warning(f"Inactive user attempted access: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive"
            )
        
        logger.debug(f"Authentication successful for user: {user.email}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

def get_optional_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[PGUser]:
    """
    Get current user if authenticated, otherwise return None
    Used for optional authentication endpoints
    """
    try:
        return get_current_user(request, credentials, db)
    except HTTPException:
        return None

def verify_admin_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> PGUser:
    user = get_current_user(request, credentials, db)
    if not getattr(user, 'is_admin', False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return user