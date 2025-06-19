from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from core.config import settings
import requests
import jwt
import secrets
from datetime import datetime, timedelta

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
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    url = GOOGLE_AUTH_URL + "?" + "&".join([f"{k}={v}" for k, v in params.items()])
    return RedirectResponse(url)

@router.get("/google/callback")
def google_callback(request: Request, response: Response, code: str = None):
    if not code:
        # Redirect to login with error message
        return RedirectResponse(url="/login?error=missing_code")
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
        # Redirect to login with error message
        return RedirectResponse(url="/login?error=token_exchange_failed")
    tokens = token_resp.json()
    id_token = tokens.get("id_token")
    access_token = tokens.get("access_token")
    if not access_token:
        return RedirectResponse(url="/login?error=missing_access_token")
    # Get user info
    userinfo_resp = requests.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
    if not userinfo_resp.ok:
        return RedirectResponse(url="/login?error=userinfo_failed")
    userinfo = userinfo_resp.json()
    # --- User persistence logic (pseudo, replace with actual DB logic) ---
    # from services.user_service import save_or_update_user
    # save_or_update_user(userinfo)
    # ---------------------------------------------------------------
    # Create JWT/session
    session_token = create_jwt(userinfo)
    # Set secure HTTP-only cookie with path='/'.
    response = RedirectResponse(url="/dashboard")
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * JWT_EXPIRE_MINUTES,
        path="/"
    )
    return response

@router.get("/me")
def get_me(request: Request):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"user": payload["user"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")

@router.post("/logout")
def logout(response: Response):
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(SESSION_COOKIE_NAME)
    return response

def create_jwt(userinfo: dict) -> str:
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