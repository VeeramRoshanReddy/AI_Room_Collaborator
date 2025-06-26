from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Application Settings - Hardcoded values
    APP_NAME: str = "AI Learning Platform"
    DEBUG: bool = True
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")  # From .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FRONTEND_URL: str = "https://room-connect-eight.vercel.app"
    
    # CORS Settings - Hardcoded values
    ALLOWED_ORIGINS: List[str] = [
        "https://room-connect-eight.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    ALLOWED_HOSTS: List[str] = [
        "ai-room-collaborator.onrender.com",
        "localhost",
        "127.0.0.1"
    ]
    
    # Google OAuth2 Settings - From .env
    GOOGLE_OAUTH2_CLIENT_ID: str = os.getenv("GOOGLE_OAUTH2_CLIENT_ID", "")
    GOOGLE_OAUTH2_CLIENT_SECRET: str = os.getenv("GOOGLE_OAUTH2_CLIENT_SECRET", "")
    
    # Database Settings - From .env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")  # From .env
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")  # From .env
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")  # From .env
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")  # From .env
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")  # From .env
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
    VECTOR_DB_URL: str = os.getenv("VECTOR_DB_URL", "")  # From .env
    VECTOR_DB_API_KEY: str = os.getenv("VECTOR_DB_API_KEY", "")  # From .env
    
    # Firebase - From .env
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")  # From .env
    FIREBASE_PRIVATE_KEY_ID: str = os.getenv("FIREBASE_PRIVATE_KEY_ID", "")  # From .env
    FIREBASE_PRIVATE_KEY: str = os.getenv("FIREBASE_PRIVATE_KEY", "")  # From .env
    FIREBASE_CLIENT_EMAIL: str = os.getenv("FIREBASE_CLIENT_EMAIL", "")  # From .env
    FIREBASE_CLIENT_ID: str = os.getenv("FIREBASE_CLIENT_ID", "")  # From .env
    FIREBASE_AUTH_URI: str = os.getenv("FIREBASE_AUTH_URI", "")  # From .env
    FIREBASE_TOKEN_URI: str = os.getenv("FIREBASE_TOKEN_URI", "")  # From .env
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: str = os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL", "")  # From .env
    FIREBASE_CLIENT_X509_CERT_URL: str = os.getenv("FIREBASE_CLIENT_X509_CERT_URL", "")  # From .env
    
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
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()