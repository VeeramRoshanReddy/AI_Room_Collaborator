from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Application Settings
    APP_NAME: str = "AI Learning Platform"
    DEBUG: bool = True
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    
    # Database Settings
    # PostgreSQL (Supabase)
    DATABASE_URL: str = "postgresql://username:password@localhost:5432/ai_learning_platform"
    SUPABASE_URL: str = "your-supabase-url"
    SUPABASE_KEY: str = "your-supabase-anon-key"
    SUPABASE_SERVICE_KEY: str = "your-supabase-service-key"
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "ai_learning_platform"
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = "290635245122-a60ie2u5b8ga1lklu79tktgecs3s7l6c.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET: str = "your-google-client-secret"
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    
    # OpenAI
    OPENAI_API_KEY: str = "your-openai-api-key"
    OPENAI_MODEL: str = "gpt-4"
    
    # Firebase (for file storage)
    FIREBASE_PROJECT_ID: str = "your-firebase-project-id"
    FIREBASE_PRIVATE_KEY_ID: str = "your-firebase-private-key-id"
    FIREBASE_PRIVATE_KEY: str = "your-firebase-private-key"
    FIREBASE_CLIENT_EMAIL: str = "your-firebase-client-email"
    FIREBASE_CLIENT_ID: str = "your-firebase-client-id"
    FIREBASE_AUTH_URI: str = "https://accounts.google.com/o/oauth2/auth"
    FIREBASE_TOKEN_URI: str = "https://oauth2.googleapis.com/token"
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: str = "https://www.googleapis.com/oauth2/v1/certs"
    FIREBASE_CLIENT_X509_CERT_URL: str = "your-firebase-cert-url"
    
    # Redis (for caching and Celery)
    REDIS_URL: str = "redis://localhost:6379"
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "doc", "docx", "txt", "md"]
    UPLOAD_DIR: str = "uploads"
    
    # Audio Generation
    ELEVENLABS_API_KEY: str = "your-elevenlabs-api-key"
    ELEVENLABS_VOICE_ID: str = "your-elevenlabs-voice-id"
    
    # Quiz Generation
    QUIZ_DIFFICULTY: str = "medium"
    QUIZ_QUESTIONS_PER_QUIZ: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings() 