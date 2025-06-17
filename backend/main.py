from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn

from api import auth, user, room, topic, notes, chat, quiz, audio
from core.config import settings

app = FastAPI(
    title="AI Learning Platform API",
    description="Backend API for AI-powered collaborative learning platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(user.router, prefix="/api/users", tags=["Users"])
app.include_router(room.router, prefix="/api/rooms", tags=["Rooms"])
app.include_router(topic.router, prefix="/api/topics", tags=["Topics"])
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(audio.router, prefix="/api/audio", tags=["Audio"])

@app.get("/")
async def root():
    return {"message": "AI Learning Platform API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 