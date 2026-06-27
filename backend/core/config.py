from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )
    # Application Settings
    APP_NAME: str = "StudyBuddy"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "An AI-powered platform for collaborative learning and knowledge sharing."
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")  # From .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "https://room-connect-eight.vercel.app"
    API_V1_PREFIX: str = "/api/v1"

    # CORS Settings - explicit origins required since credentials are allowed
    # (browsers reject a wildcard "*" origin combined with allow_credentials=True)
    ALLOWED_ORIGINS: List[str] = [
        "https://room-connect-eight.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
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
    OPENAI_MODEL: str = "gpt-4o-mini"
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
    
    # File Upload - Hardcoded values
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "doc", "docx", "txt", "md"]

    # AWS S3 - From .env (used for note file uploads and generated audio)
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_S3_BUCKET: str = os.getenv("AWS_S3_BUCKET", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")

    # Audio Generation - From .env
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")  # From .env
    ELEVENLABS_VOICE_ID: str = os.getenv("ELEVENLABS_VOICE_ID", "")  # From .env
    ELEVENLABS_HOST_VOICE_ID: str = os.getenv("ELEVENLABS_HOST_VOICE_ID", "")
    ELEVENLABS_EXPERT_VOICE_ID: str = os.getenv("ELEVENLABS_EXPERT_VOICE_ID", "")

settings = Settings()