#!/usr/bin/env python3
"""
AI Room Collaborator Setup Script
Automated installation and configuration for the AI Room Collaborator platform.
"""

import os
import sys
import subprocess
import json
import secrets
import string
from pathlib import Path
from urllib.parse import urlparse
import platform

__version__ = '1.0.0'

class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    """Print a formatted header"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}{Colors.ENDC}\n")

def print_step(text):
    """Print a step message"""
    print(f"{Colors.OKBLUE}➤ {text}{Colors.ENDC}")

def print_success(text):
    """Print a success message"""
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_warning(text):
    """Print a warning message"""
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def print_error(text):
    """Print an error message"""
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def run_command(command, cwd=None, check=True):
    """Run a shell command and return the result"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            check=check,
            capture_output=True,
            text=True
        )
        return result
    except subprocess.CalledProcessError as e:
        print_error(f"Command failed: {command}")
        print_error(f"Error: {e.stderr}")
        return e

def check_python_version():
    """Check if Python version is compatible"""
    print_step("Checking Python version...")
    
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print_error("Python 3.9 or higher is required")
        print(f"Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    
    print_success(f"Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def check_node_version():
    """Check if Node.js is installed and compatible"""
    print_step("Checking Node.js version...")
    
    result = run_command("node --version", check=False)
    if result.returncode != 0:
        print_error("Node.js is not installed")
        print_warning("Please install Node.js 16+ from https://nodejs.org/")
        return False
    
    version = result.stdout.strip().replace('v', '')
    major_version = int(version.split('.')[0])
    
    if major_version < 16:
        print_error("Node.js 16 or higher is required")
        print(f"Current version: {version}")
        return False
    
    print_success(f"Node.js {version} is compatible")
    return True

def generate_secret_key():
    """Generate a secure secret key"""
    return secrets.token_urlsafe(32)

def generate_encryption_key():
    """Generate a Fernet encryption key"""
    from cryptography.fernet import Fernet
    return Fernet.generate_key().decode()

def generate_room_id():
    """Generate a random 8-digit room ID"""
    return ''.join(secrets.choice(string.digits) for _ in range(8))

def create_env_file(backend_dir):
    """Create .env file with default configuration"""
    print_step("Creating environment configuration...")
    
    env_content = f"""# AI Room Collaborator Environment Configuration

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/airoom
MONGODB_URL=mongodb://localhost:27017/airoom
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY={generate_secret_key()}
ALGORITHM=HS256
ENCRYPTION_KEY={generate_encryption_key()}

# OpenAI (Required)
OPENAI_API_KEY=your-openai-api-key

# Application Settings
DEBUG=True
ALLOWED_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
ALLOWED_HOSTS=["localhost", "127.0.0.1"]
MAX_FILE_SIZE=10485760
APP_NAME=AI Room Collaborator

# Optional: ElevenLabs for audio generation
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Optional: Anthropic for AI features
ANTHROPIC_API_KEY=your-anthropic-api-key
"""
    
    env_path = backend_dir / ".env"
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print_success("Environment file created")
    print_warning("Please update the .env file with your actual API keys and credentials")
    return env_path

def create_frontend_env_file(frontend_dir):
    """Create frontend .env file"""
    print_step("Creating frontend environment configuration...")
    
    env_content = """# Frontend Environment Configuration

REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_DEBUG=true
"""
    
    env_path = frontend_dir / ".env"
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print_success("Frontend environment file created")
    return env_path

def install_backend_dependencies(backend_dir):
    """Install Python dependencies"""
    print_step("Installing backend dependencies...")
    
    # Check if virtual environment exists
    venv_path = backend_dir / ".venv"
    if not venv_path.exists():
        print_step("Creating virtual environment...")
        result = run_command("python -m venv .venv", cwd=backend_dir)
        if result.returncode != 0:
            print_error("Failed to create virtual environment")
            return False
    
    # Activate virtual environment and install dependencies
    if platform.system() == "Windows":
        pip_path = venv_path / "Scripts" / "pip"
        python_path = venv_path / "Scripts" / "python"
    else:
        pip_path = venv_path / "bin" / "pip"
        python_path = venv_path / "bin" / "python"
    
    print_step("Installing Python packages...")
    result = run_command(f"{pip_path} install --upgrade pip", cwd=backend_dir)
    if result.returncode != 0:
        print_error("Failed to upgrade pip")
        return False
    
    result = run_command(f"{pip_path} install -r requirements.txt", cwd=backend_dir)
    if result.returncode != 0:
        print_error("Failed to install dependencies")
        return False
    
    print_success("Backend dependencies installed")
    return True

def install_frontend_dependencies(frontend_dir):
    """Install Node.js dependencies"""
    print_step("Installing frontend dependencies...")
    
    result = run_command("npm install", cwd=frontend_dir)
    if result.returncode != 0:
        print_error("Failed to install frontend dependencies")
        return False
    
    print_success("Frontend dependencies installed")
    return True

def create_database_scripts(backend_dir):
    """Create database initialization scripts"""
    print_step("Creating database scripts...")
    
    scripts_dir = backend_dir / "scripts"
    scripts_dir.mkdir(exist_ok=True)
    
    # PostgreSQL setup script
    postgres_script = scripts_dir / "setup_postgres.sql"
    with open(postgres_script, 'w') as f:
        f.write("""-- PostgreSQL Database Setup for AI Room Collaborator

-- Create database
CREATE DATABASE airoom;

-- Connect to the database
\\c airoom;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Tables will be created automatically by SQLAlchemy
-- Run the application to initialize the database schema
""")
    
    # MongoDB setup script
    mongo_script = scripts_dir / "setup_mongo.js"
    with open(mongo_script, 'w') as f:
        f.write("""// MongoDB Setup for AI Room Collaborator

// Create database
use airoom;

// Create collections (will be created automatically by the application)
// db.createCollection('group_chat_logs');
// db.createCollection('note_chat_logs');
// db.createCollection('ai_responses');

print('MongoDB database "airoom" created successfully');
print('Collections will be created automatically when the application starts');
""")
    
    print_success("Database scripts created")
    return True

def create_startup_scripts():
    """Create startup scripts for development"""
    print_step("Creating startup scripts...")
    
    # Backend startup script
    backend_start = Path("start_backend.py")
    with open(backend_start, 'w') as f:
        f.write("""#!/usr/bin/env python3
\"\"\"
Backend Startup Script for AI Room Collaborator
\"\"\"

import os
import sys
import subprocess
from pathlib import Path

def main():
    backend_dir = Path("backend")
    
    # Check if virtual environment exists
    venv_path = backend_dir / ".venv"
    if not venv_path.exists():
        print("Virtual environment not found. Please run setup.py first.")
        sys.exit(1)
    
    # Activate virtual environment and start server
    if os.name == 'nt':  # Windows
        python_path = venv_path / "Scripts" / "python"
    else:  # Unix/Linux/Mac
        python_path = venv_path / "bin" / "python"
    
    print("Starting AI Room Collaborator Backend...")
    print("API will be available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Press Ctrl+C to stop the server")
    
    try:
        subprocess.run([
            str(python_path), "-m", "uvicorn", "main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload"
        ], cwd=backend_dir)
    except KeyboardInterrupt:
        print("\\nBackend server stopped")

if __name__ == "__main__":
    main()
""")
    
    # Frontend startup script
    frontend_start = Path("start_frontend.py")
    with open(frontend_start, 'w') as f:
        f.write("""#!/usr/bin/env python3
\"\"\"
Frontend Startup Script for AI Room Collaborator
\"\"\"

import subprocess
import sys
from pathlib import Path

def main():
    frontend_dir = Path("frontend")
    
    if not frontend_dir.exists():
        print("Frontend directory not found.")
        sys.exit(1)
    
    print("Starting AI Room Collaborator Frontend...")
    print("Frontend will be available at: http://localhost:3000")
    print("Press Ctrl+C to stop the server")
    
    try:
        subprocess.run(["npm", "start"], cwd=frontend_dir)
    except KeyboardInterrupt:
        print("\\nFrontend server stopped")

if __name__ == "__main__":
    main()
""")
    
    # Make scripts executable on Unix systems
    if platform.system() != "Windows":
        os.chmod(backend_start, 0o755)
        os.chmod(frontend_start, 0o755)
    
    print_success("Startup scripts created")
    return True

def create_docker_files():
    """Create Docker configuration files"""
    print_step("Creating Docker configuration...")
    
    # Dockerfile for backend
    dockerfile = Path("Dockerfile")
    with open(dockerfile, 'w') as f:
        f.write("""# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Expose port
EXPOSE 8000

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
""")
    
    # Docker Compose file
    docker_compose = Path("docker-compose.yml")
    with open(docker_compose, 'w') as f:
        f.write("""version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/airoom
      - MONGODB_URL=mongodb://mongo:27017/airoom
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - mongo
      - redis
    volumes:
      - ./backend:/app
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000/api/v1
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=airoom
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  mongo_data:
  redis_data:
""")
    
    print_success("Docker configuration created")
    return True

def create_development_guide():
    """Create development guide"""
    print_step("Creating development guide...")
    
    guide_content = """# AI Room Collaborator - Development Guide

## Quick Start

1. **Start Backend Server**:
   ```bash
   python start_backend.py
   ```

2. **Start Frontend Server**:
   ```bash
   python start_frontend.py
   ```

3. **Access the Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Environment Setup

### Required Services

1. **PostgreSQL Database**:
   - Install PostgreSQL locally or use a cloud service
   - Create database: `airoom`
   - Update `DATABASE_URL` in backend/.env

2. **MongoDB Database**:
   - Install MongoDB locally or use MongoDB Atlas
   - Create database: `airoom`
   - Update `MONGODB_URL` in backend/.env

3. **Redis Server**:
   - Install Redis locally or use Redis Cloud
   - Update `REDIS_URL` in backend/.env

## Development Workflow

1. **Backend Development**:
   - Code is in `backend/` directory
   - API endpoints in `backend/api/`
   - Models in `backend/models/`
   - Services in `backend/services/`

2. **Frontend Development**:
   - Code is in `frontend/` directory
   - Components in `frontend/src/components/`
   - Context in `frontend/src/context/`

3. **Database Changes**:
   - Update models in `backend/models/`
   - Run database migrations
   - Test with sample data

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Deployment

See README.md for detailed deployment instructions.

## Troubleshooting

1. **Database Connection Issues**:
   - Check database URLs in .env files
   - Ensure databases are running
   - Verify network connectivity

2. **API Key Issues**:
   - Verify all required API keys are set
   - Check API key permissions
   - Test API keys individually

3. **WebSocket Issues**:
   - Check firewall settings
   - Verify WebSocket endpoint URLs
   - Test with browser developer tools

## Support

- Check the main README.md for detailed documentation
- Create issues on GitHub for bugs
- Join discussions for questions and ideas
"""
    
    with open("DEVELOPMENT.md", 'w') as f:
        f.write(guide_content)
    
    print_success("Development guide created")
    return True

def main():
    """Main setup function"""
    print_header("AI Room Collaborator Setup")
    
    # Check prerequisites
    if not check_python_version():
        sys.exit(1)
    
    if not check_node_version():
        sys.exit(1)
    
    # Get project directories
    project_root = Path.cwd()
    backend_dir = project_root / "backend"
    frontend_dir = project_root / "frontend"
    
    # Check if directories exist
    if not backend_dir.exists():
        print_error("Backend directory not found")
        sys.exit(1)
    
    if not frontend_dir.exists():
        print_error("Frontend directory not found")
        sys.exit(1)
    
    print_success("Project structure verified")
    
    # Create environment files
    backend_env = create_env_file(backend_dir)
    frontend_env = create_frontend_env_file(frontend_dir)
    
    # Install dependencies
    if not install_backend_dependencies(backend_dir):
        sys.exit(1)
    
    if not install_frontend_dependencies(frontend_dir):
        sys.exit(1)
    
    # Create additional files
    create_database_scripts(backend_dir)
    create_startup_scripts()
    create_docker_files()
    create_development_guide()
    
    # Final instructions
    print_header("Setup Complete!")
    
    print_success("AI Room Collaborator has been set up successfully!")
    print("\nNext steps:")
    print("1. Update the environment files with your API keys:")
    print(f"   - Backend: {backend_env}")
    print(f"   - Frontend: {frontend_env}")
    print("\n2. Set up your databases (PostgreSQL, MongoDB, Redis)")
    print("\n3. Start the development servers:")
    print("   - Backend: python start_backend.py")
    print("   - Frontend: python start_frontend.py")
    print("\n4. Access the application:")
    print("   - Frontend: http://localhost:3000")
    print("   - Backend API: http://localhost:8000")
    print("   - API Docs: http://localhost:8000/docs")
    print("\n5. Read DEVELOPMENT.md for detailed development guide")
    print("\nHappy coding! 🚀")

if __name__ == "__main__":
    main() 