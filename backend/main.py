# main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi import WebSocket
import uvicorn
import logging
import time
from fastapi.exception_handlers import RequestValidationError
from fastapi.exceptions import RequestValidationError as FastAPIRequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi import status
import traceback

from api import auth, user, room, topic, notes, chat, quiz, audio
from core.config import settings
from core.database import init_db
from core.websocket import websocket_endpoint

# Configure logging for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        # Add file handler for production
        # logging.FileHandler('/var/log/airoom/app.log')
    ]
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AI Learning Platform API",
    description="Production API for AI-powered collaborative learning platform",
    version="1.0.0",
    docs_url=None,  # Disable docs in production
    redoc_url=None,  # Disable redoc in production
    # Enable docs only in development
    # docs_url="/docs" if settings.DEBUG else None,
    # redoc_url="/redoc" if settings.DEBUG else None
)

# CORS middleware - configured for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://room-connect-eight.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Trusted host middleware for security
if hasattr(settings, 'ALLOWED_HOSTS') and settings.ALLOWED_HOSTS:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# Request logging and monitoring middleware
@app.middleware("http")
async def process_request(request: Request, call_next):
    start_time = time.time()
    
    # Log request (no sensitive data)
    logger.info(f"Request: {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        
        # Log response timing
        process_time = time.time() - start_time
        logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
        
        return response
        
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request failed: {request.method} {request.url.path} - {str(e)} - {process_time:.3f}s")
        
        # Return generic error response
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc),
            "trace": traceback.format_exc()
        },
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail or "HTTP error"}
    )

@app.exception_handler(FastAPIRequestValidationError)
async def validation_exception_handler(request: Request, exc: FastAPIRequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()}
    )

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(user.router, prefix="/api/user", tags=["Users"])
app.include_router(room.router, prefix="/api/room", tags=["Rooms"])
app.include_router(topic.router, prefix="/api/topic", tags=["Topics"])
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(audio.router, prefix="/api/audio", tags=["Audio"])

# WebSocket endpoint for real-time chat
@app.websocket("/ws/{room_id}/{topic_id}")
async def websocket_endpoint_route(
    websocket: WebSocket,
    room_id: str,
    topic_id: str,
    token: str = None
):
    """WebSocket endpoint for real-time chat functionality"""
    await websocket_endpoint(websocket, room_id, topic_id, token)

# Root endpoints
@app.get("/")
async def root():
    return {
        "message": "AI Learning Platform API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers"""
    return {
        "status": "healthy",
        "timestamp": time.time()
    }

@app.get("/api/health")
async def api_health_check():
    """API-specific health check"""
    return {
        "api_status": "healthy",
        "version": "1.0.0",
        "timestamp": time.time()
    }

# Handle preflight OPTIONS requests
@app.options("/{path:path}")
async def options_handler(request: Request):
    origin = request.headers.get("origin")
    allowed_origins = [
        "https://room-connect-eight.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    headers = {
        "Access-Control-Allow-Origin": origin if origin in allowed_origins else "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "true"
    }
    return JSONResponse(content={"message": "OK"}, headers=headers)

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("AI Learning Platform API starting up...")
    logger.info(f"CORS origins: {settings.ALLOWED_ORIGINS}")
    init_db()

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("AI Learning Platform API shutting down...")

@app.api_route('/{full_path:path}', methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def catch_all_global(full_path: str, request: Request):
    return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": "Not found", "path": f"/{full_path}"})

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable reload in production
        access_log=True,
        log_level="info"
    )