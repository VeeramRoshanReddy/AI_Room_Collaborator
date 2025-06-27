# main.py
from fastapi import FastAPI, Request, HTTPException
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
from contextlib import asynccontextmanager
import os
from datetime import datetime

from api import auth, user, room, topic, notes, chat, quiz, audio
from core.config import settings
from core.database import init_db, connect_to_mongo, close_mongo_connection
from core.websocket import websocket_endpoint
from core.security import LoggingMiddleware

# Configure logging for production
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        # Add file handler for production
        # logging.FileHandler('/var/log/airoom/app.log')
    ]
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting AI Room Collaborator application...")
    
    try:
        # Initialize database
        init_db()
        logger.info("Database initialized successfully")
        
        # Connect to MongoDB
        await connect_to_mongo()
        logger.info("MongoDB connected successfully")
        
        logger.info("Application startup completed")
        yield
        
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise
    finally:
        # Shutdown
        logger.info("Shutting down application...")
        try:
            await close_mongo_connection()
            logger.info("MongoDB connection closed")
        except Exception as e:
            logger.error(f"Shutdown error: {e}")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI Room Collaborator - A comprehensive platform for collaborative learning with AI-powered features",
    version="1.0.0",
    debug=settings.DEBUG,
    lifespan=lifespan
)

# CORS middleware - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Trusted host middleware for security
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# Add logging middleware
app.add_middleware(LoggingMiddleware)

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
    """Global exception handler for unhandled errors"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "timestamp": datetime.utcnow().isoformat(),
            "path": request.url.path
        }
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
app.include_router(auth.router, prefix="/api/v1")
app.include_router(user.router, prefix="/api/v1")
app.include_router(room.router, prefix="/api/v1")
app.include_router(topic.router, prefix="/api/v1")
app.include_router(notes.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")

# Include additional feature routers if they exist
try:
    app.include_router(quiz.router, prefix="/api/v1")
except ImportError:
    logger.warning("Quiz router not available")

try:
    app.include_router(audio.router, prefix="/api/v1")
except ImportError:
    logger.warning("Audio router not available")

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
    """Root endpoint with API information"""
    return {
        "message": "AI Room Collaborator API",
        "version": "1.0.0",
        "description": "A comprehensive platform for collaborative learning with AI-powered features",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc",
            "auth": "/auth",
            "rooms": "/rooms",
            "topics": "/topics",
            "notes": "/notes",
            "chat": "/chat",
            "users": "/users"
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": "production" if not settings.DEBUG else "development"
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
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "true"
    }
    return JSONResponse(content={"message": "OK"}, headers=headers)

# API documentation customization
@app.get("/api/v1")
async def api_info():
    """API information and available endpoints"""
    return {
        "api_name": "AI Room Collaborator API",
        "version": "1.0.0",
        "description": "A comprehensive platform for collaborative learning with AI-powered features",
        "features": {
            "authentication": {
                "description": "Multiple authentication methods (Google OAuth2, Supabase, Email/Password)",
                "endpoints": ["/auth/signup", "/auth/login", "/auth/google", "/auth/supabase"]
            },
            "rooms": {
                "description": "Collaborative rooms with 8-digit IDs and passwords",
                "endpoints": ["/rooms/create", "/rooms/join", "/rooms/my-rooms"]
            },
            "topics": {
                "description": "Topics within rooms for focused discussions",
                "endpoints": ["/topics/create", "/topics/room/{room_id}"]
            },
            "notes": {
                "description": "Private notes with file upload and AI features",
                "endpoints": ["/notes/create", "/notes/my-notes", "/notes/{note_id}/upload-file"]
            },
            "chat": {
                "description": "Real-time encrypted chat with AI integration",
                "endpoints": ["/chat/group/{room_id}/{topic_id}", "/chat/note/{note_id}"]
            },
            "ai_features": {
                "description": "AI-powered document analysis, quiz generation, and audio overviews",
                "endpoints": ["/notes/{note_id}/generate-quiz", "/notes/{note_id}/generate-audio"]
            }
        },
        "websocket_endpoints": {
            "group_chat": "/api/v1/chat/group/{room_id}/{topic_id}",
            "note_chat": "/api/v1/chat/note/{note_id}"
        },
        "authentication": {
            "methods": ["Google OAuth2", "Supabase Auth", "Email/Password"],
            "token_type": "JWT Bearer Token"
        },
        "database": {
            "postgresql": "Structured data (users, rooms, topics, notes)",
            "mongodb": "Chat logs and AI responses",
            "redis": "Real-time features and caching"
        },
        "security": {
            "encryption": "End-to-end encryption for chat messages",
            "authentication": "JWT-based authentication",
            "authorization": "Role-based access control"
        }
    }

# Error handling for 404
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    """Handle 404 errors"""
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Endpoint not found",
            "path": request.url.path,
            "method": request.method,
            "timestamp": datetime.utcnow().isoformat(),
            "suggestions": {
                "api_docs": "/docs",
                "health_check": "/health",
                "api_info": "/api/v1"
            }
        }
    )

# Error handling for 422 (validation errors)
@app.exception_handler(422)
async def validation_error_handler(request: Request, exc: HTTPException):
    """Handle validation errors"""
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "path": request.url.path,
            "method": request.method,
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Request data validation failed. Please check your input."
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug"
    )