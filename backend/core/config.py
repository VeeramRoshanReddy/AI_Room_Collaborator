from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Application Settings
    APP_NAME: str = os.getenv("APP_NAME")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS", "https://ai-room-collaborator.vercel.app").split(",")
    ALLOWED_HOSTS: List[str] = os.getenv("ALLOWED_HOSTS", "ai-room-collaborator.vercel.app").split(",")
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY")
    MONGODB_URL: str = os.getenv("MONGODB_URL")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE")
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI")
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4")
    OPENAI_MAX_TOKENS: int = int(os.getenv("OPENAI_MAX_TOKENS", "2000"))
    OPENAI_TEMPERATURE: float = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))
    
    # Encryption Settings for End-to-End Chat
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY")
    CHAT_ENCRYPTION_ENABLED: bool = os.getenv("CHAT_ENCRYPTION_ENABLED", "true").lower() == "true"
    
    # Vector Database for RAG (Notes Section)
    VECTOR_DB_TYPE: str = os.getenv("VECTOR_DB_TYPE", "pinecone")  # mongodb, pinecone, qdrant
    VECTOR_DB_URL: str = os.getenv("VECTOR_DB_URL")
    VECTOR_DB_API_KEY: str = os.getenv("VECTOR_DB_API_KEY")
    
    # Firebase
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID")
    FIREBASE_PRIVATE_KEY_ID: str = os.getenv("FIREBASE_PRIVATE_KEY_ID")
    FIREBASE_PRIVATE_KEY: str = os.getenv("FIREBASE_PRIVATE_KEY")
    FIREBASE_CLIENT_EMAIL: str = os.getenv("FIREBASE_CLIENT_EMAIL")
    FIREBASE_CLIENT_ID: str = os.getenv("FIREBASE_CLIENT_ID")
    FIREBASE_AUTH_URI: str = os.getenv("FIREBASE_AUTH_URI")
    FIREBASE_TOKEN_URI: str = os.getenv("FIREBASE_TOKEN_URI")
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: str = os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL")
    FIREBASE_CLIENT_X509_CERT_URL: str = os.getenv("FIREBASE_CLIENT_X509_CERT_URL")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL")
    
    # File Upload
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))
    ALLOWED_FILE_TYPES: List[str] = os.getenv("ALLOWED_FILE_TYPES", "pdf,doc,docx,txt,md").split(",")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    
    # Audio Generation
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY")
    ELEVENLABS_VOICE_ID: str = os.getenv("ELEVENLABS_VOICE_ID")
    
    # Quiz Generation
    QUIZ_DIFFICULTY: str = os.getenv("QUIZ_DIFFICULTY", "medium")
    QUIZ_QUESTIONS_PER_QUIZ: int = int(os.getenv("QUIZ_QUESTIONS_PER_QUIZ", "10"))
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings() 