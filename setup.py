#!/usr/bin/env python3
"""
AI Room Collaborator Setup Script
This script helps you set up the AI Room Collaborator project.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def print_banner():
    """Print the project banner"""
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║                    AI Room Collaborator                      ║
    ║                Setup and Installation Script                 ║
    ╚══════════════════════════════════════════════════════════════╝
    """)

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8 or higher is required")
        print(f"   Current version: {sys.version}")
        sys.exit(1)
    print(f"✅ Python version: {sys.version.split()[0]}")

def check_node_version():
    """Check if Node.js is installed and version is compatible"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ Node.js version: {version}")
        else:
            print("❌ Node.js is not installed")
            print("   Please install Node.js 16 or higher from https://nodejs.org/")
            sys.exit(1)
    except FileNotFoundError:
        print("❌ Node.js is not installed")
        print("   Please install Node.js 16 or higher from https://nodejs.org/")
        sys.exit(1)

def create_env_file():
    """Create .env file from template"""
    backend_env = Path("backend/.env")
    frontend_env = Path("frontend/.env")
    
    if not backend_env.exists():
        print("📝 Creating backend .env file...")
        backend_env.write_text("""# Application Settings
SECRET_KEY=your-super-secret-key-change-this-in-production
DEBUG=True
FRONTEND_URL=http://localhost:3000

# Google OAuth2 Settings
GOOGLE_OAUTH2_CLIENT_ID=your-google-oauth2-client-id
GOOGLE_OAUTH2_CLIENT_SECRET=your-google-oauth2-client-secret

# Database Settings
DATABASE_URL=postgresql://username:password@localhost:5432/airoom
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=ai_room_collaborator

# OpenAI Settings
OPENAI_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# Encryption Settings
ENCRYPTION_KEY=your-32-character-encryption-key
CHAT_ENCRYPTION_ENABLED=True

# Redis Settings (Optional)
REDIS_URL=redis://localhost:6379
""")
        print("✅ Backend .env file created")
    else:
        print("✅ Backend .env file already exists")
    
    if not frontend_env.exists():
        print("📝 Creating frontend .env file...")
        frontend_env.write_text("""REACT_APP_API_URL=http://localhost:8000
""")
        print("✅ Frontend .env file created")
    else:
        print("✅ Frontend .env file already exists")

def install_backend_dependencies():
    """Install backend Python dependencies"""
    print("📦 Installing backend dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"], check=True)
        print("✅ Backend dependencies installed")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing backend dependencies: {e}")
        sys.exit(1)

def install_frontend_dependencies():
    """Install frontend Node.js dependencies"""
    print("📦 Installing frontend dependencies...")
    try:
        subprocess.run(["npm", "install"], cwd="frontend", check=True)
        print("✅ Frontend dependencies installed")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing frontend dependencies: {e}")
        sys.exit(1)

def create_directories():
    """Create necessary directories"""
    directories = [
        "backend/uploads",
        "backend/logs",
        "frontend/public/uploads"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
    
    print("✅ Directories created")

def print_next_steps():
    """Print next steps for the user"""
    print("""
    🎉 Setup completed successfully!
    
    📋 Next Steps:
    
    1. Configure Environment Variables:
       - Edit backend/.env with your actual credentials
       - Edit frontend/.env with your API URL
    
    2. Set up Databases:
       - Install and start PostgreSQL
       - Install and start MongoDB
       - Install and start Redis (optional)
    
    3. Get API Keys:
       - Google OAuth2 credentials from Google Cloud Console
       - OpenAI API key from OpenAI
    
    4. Start the Application:
       Backend:  cd backend && uvicorn main:app --reload
       Frontend: cd frontend && npm start
    
    5. Access the Application:
       - Frontend: http://localhost:3000
       - Backend API: http://localhost:8000
    
    📚 For detailed instructions, see README.md
    """)

def main():
    """Main setup function"""
    print_banner()
    
    print("🔍 Checking system requirements...")
    check_python_version()
    check_node_version()
    
    print("\n📁 Creating configuration files...")
    create_env_file()
    
    print("\n📦 Installing dependencies...")
    install_backend_dependencies()
    install_frontend_dependencies()
    
    print("\n📁 Creating directories...")
    create_directories()
    
    print("\n" + "="*60)
    print_next_steps()

if __name__ == "__main__":
    main() 