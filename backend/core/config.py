from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Application Settings - Hardcoded values
    APP_NAME: str = "RoomConnect - AI Learning Platform"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "An AI-powered platform for collaborative learning and knowledge sharing."
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")  # From .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "https://room-connect-eight.vercel.app"
    API_V1_PREFIX: str = "/api/v1"
    
    # CORS Settings - Hardcoded values
    ALLOWED_ORIGINS: List[str] = ['*']
    ALLOWED_HOSTS: List[str] = [
        "ai-room-collaborator.onrender.com",
        "localhost",
        "127.0.0.1"
    ]
    
    # Database Settings - From .env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")  # From .env
    MONGODB_URL: str = os.getenv("MONGODB_URL", "")  # From .env
    MONGODB_DATABASE: str = "ai_room_collaborator"
    
    # OpenAI - From .env
    OPENAI_KEY: str = os.getenv("OPENAI_KEY", "")  # From .env
    OPENAI_MODEL: str = "gpt-4"
    OPENAI_MAX_TOKENS: int = 2000
    OPENAI_TEMPERATURE: float = 0.7
    
    # Encryption Settings - From .env
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "")  # From .env
    CHAT_ENCRYPTION_ENABLED: bool = True
    
    # Vector Database for RAG - From .env
    VECTOR_DB_TYPE: str = "pinecone"
    VECTOR_DB_REGION: str = "us-east-1-aws"
    VECTOR_DB_URL: str = os.getenv("VECTOR_DB_URL", "")  # From .env
    VECTOR_DB_API_KEY: str = os.getenv("VECTOR_DB_API_KEY", "")  # From .env
    VECTOR_DB_INDEX_NAME: str = "ai-learning-notes"
    
    # Redis - From .env
    REDIS_URL: str = os.getenv("REDIS_URL", "")  # From .env
    
    # File Upload - Hardcoded values
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "doc", "docx", "txt", "md"]
    UPLOAD_DIR: str = "uploads"
    
    # Audio Generation - From .env
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")  # From .env
    ELEVENLABS_VOICE_ID:str = os.getenv("ELEVENLABS_VOICE_ID", "")  # From .env
    
    # Quiz Generation - Hardcoded values
    QUIZ_DIFFICULTY: str = "medium"
    QUIZ_QUESTIONS_PER_QUIZ: int = 10
    
    #Audio Processing - Hardcoded values
    AUDIO_OUTPUT_DIR: str = "audio_outputs"
    AUDIO_FORMAT: str = "mp3"
    AUDIO_QUALITY: str = "high"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # WebSocket Configuration
    WS_HEARTBEAT_INTERVAL: int = 30
    WS_MAX_CONNECTIONS: int = 1000
    
    # File Processing
    CHUNK_SIZE: int = 1000
    OVERLAP_SIZE: int = 200
    MAX_CHUNKS_PER_DOCUMENT: int = 50
    
    # AI Model Configuration
    CHAT_MODEL: str = "gpt-4"
    SUMMARY_MODEL: str= "gpt-3.5-turbo"
    QUIZ_MODEL: str= "gpt-4"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()