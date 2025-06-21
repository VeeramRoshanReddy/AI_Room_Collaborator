# main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
import time

from api import auth, user, room, topic, notes, chat, quiz, audio
from core.config import settings

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
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token",
        "Cookie",
        "Set-Cookie",
        "Cache-Control",
        "Pragma"
    ],
    expose_headers=["Set-Cookie"],
    max_age=86400,  # 24 hours
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
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
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
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("AI Learning Platform API starting up...")
    logger.info(f"CORS origins: {settings.ALLOWED_ORIGINS}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("AI Learning Platform API shutting down...")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable reload in production
        access_log=True,
        log_level="info"
    )