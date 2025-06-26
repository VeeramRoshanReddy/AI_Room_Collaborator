# AI Room Collaborator - Setup Guide

A comprehensive collaborative learning platform with AI assistance, real-time chat, document analysis, and quiz generation.

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **PostgreSQL 12+**
- **MongoDB 4.4+**
- **Redis 6+**
- **OpenAI API Key**
- **Pinecone API Key** (optional, for vector search)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-room-collaborator.git
cd ai-room-collaborator
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

#### Environment Configuration

```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your configuration
nano .env
```

**Required Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `MONGODB_URL`: MongoDB connection string
- `SECRET_KEY`: JWT secret key
- `OPENAI_API_KEY`: Your OpenAI API key
- `PINECONE_API_KEY`: Your Pinecone API key (optional)

#### Database Setup

```bash
# Create PostgreSQL database
createdb airoom_db

# Run database migrations
alembic upgrade head
```

#### Start the Backend Server

```bash
# Development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 3. Frontend Setup

#### Install Node.js Dependencies

```bash
cd frontend
npm install
```

#### Environment Configuration

Create a `.env` file in the frontend directory:

```bash
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_WS_URL=ws://localhost:8000/ws
REACT_APP_ENVIRONMENT=development
```

#### Start the Frontend Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🏗️ Architecture

### Backend (FastAPI)

- **Authentication**: JWT-based with refresh tokens
- **Database**: PostgreSQL (primary) + MongoDB (chat logs)
- **AI Integration**: OpenAI GPT-4 for chat and analysis
- **Vector Database**: Pinecone for semantic search
- **Real-time**: WebSocket for live chat
- **File Processing**: PDF, Word, and text document support
- **Audio**: Text-to-speech for document summaries

### Frontend (React)

- **UI Framework**: React 18 with styled-components
- **Routing**: React Router v6
- **State Management**: React Context API
- **Real-time**: Socket.io client
- **Forms**: React Hook Form
- **Notifications**: React Toastify
- **Icons**: React Icons

## 📁 Project Structure

```
AI_Room_Collaborator/
├── backend/
│   ├── api/                 # API endpoints
│   ├── core/               # Core configuration
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   ├── middleware/         # Custom middleware
│   └── main.py            # Application entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context
│   │   ├── themes/         # Styled-components themes
│   │   └── utils/          # Utility functions
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Backend Configuration

The backend uses environment variables for configuration. Key settings:

- **Database**: PostgreSQL for user data, MongoDB for chat logs
- **AI Models**: Configurable OpenAI models for different tasks
- **File Storage**: Local file system with configurable limits
- **Security**: JWT tokens with configurable expiration
- **Rate Limiting**: Configurable request limits

### Frontend Configuration

The frontend configuration is minimal and focuses on API endpoints:

- **API URL**: Backend API endpoint
- **WebSocket URL**: Real-time communication endpoint
- **Environment**: Development/production mode

## 🚀 Deployment

### Backend Deployment

1. **Set up a production server** (Ubuntu 20.04+ recommended)
2. **Install system dependencies**:
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip postgresql postgresql-contrib redis-server nginx
   ```

3. **Deploy the application**:
   ```bash
   # Clone the repository
   git clone https://github.com/your-username/ai-room-collaborator.git
   cd ai-room-collaborator/backend
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Set up environment
   cp env.example .env
   # Edit .env with production values
   
   # Run migrations
   alembic upgrade head
   
   # Start with Gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

### Frontend Deployment

1. **Build the application**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to a static hosting service** (Netlify, Vercel, etc.) or serve with Nginx

## 🔒 Security

### Authentication
- JWT tokens with configurable expiration
- Password hashing with bcrypt
- Refresh token rotation
- CORS configuration

### Data Protection
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy
- XSS protection with proper content types
- Rate limiting to prevent abuse

### File Upload Security
- File type validation
- File size limits
- Secure file storage
- Virus scanning (recommended for production)

## 📊 Monitoring

### Logging
- Structured logging with structlog
- Log rotation and archiving
- Error tracking with Sentry

### Health Checks
- Database connectivity checks
- External service health monitoring
- API endpoint health status

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API documentation at `/docs` when the server is running

## 🔄 Updates

To update the application:

1. **Backend**:
   ```bash
   cd backend
   git pull
   pip install -r requirements.txt
   alembic upgrade head
   ```

2. **Frontend**:
   ```bash
   cd frontend
   git pull
   npm install
   npm run build
   ```

## 📈 Performance

### Optimization Tips

- **Database**: Use connection pooling and indexes
- **Caching**: Implement Redis caching for frequently accessed data
- **CDN**: Use a CDN for static assets
- **Compression**: Enable gzip compression
- **Monitoring**: Monitor performance metrics

### Scaling

- **Horizontal Scaling**: Use load balancers
- **Database**: Implement read replicas
- **Caching**: Distributed caching with Redis
- **Background Tasks**: Use Celery for heavy operations 