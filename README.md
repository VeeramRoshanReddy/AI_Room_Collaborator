# AI Room Collaborator

A comprehensive AI-powered collaborative learning platform with real-time chat, document analysis, quiz generation, and audio overviews.

## 🚀 Features

### 🔐 Authentication & User Management
- **Google OAuth2 Integration**: Secure authentication with automatic user creation
- **Profile Management**: User profiles with Google profile pictures
- **JWT Token Authentication**: Secure session management

### 🏠 Room Management
- **8-Digit Room IDs & Passwords**: Auto-generated unique room identifiers
- **Room Creation & Joining**: Create rooms with descriptions, join with room ID/password
- **Admin Management**: Multiple admins per room with promotion/demotion capabilities
- **Member Management**: Add, remove, and manage room participants
- **Room Deletion**: Admin-only room deletion with cascade cleanup

### 💬 Real-Time Chat
- **WebSocket Implementation**: Real-time messaging without page reloads
- **End-to-End Encryption**: Secure message encryption for privacy
- **AI Chatbot Integration**: @chatbot functionality for AI assistance
- **Message Persistence**: Chat history stored in MongoDB
- **Typing Indicators**: Real-time typing status
- **Read Receipts**: Message read status tracking

### 📚 Personal Work Space
- **Private Notes**: User-exclusive note creation and management
- **Document Upload**: Support for PDF, DOC, DOCX, TXT files
- **AI Document Analysis**: Automatic document summarization
- **Persistent Chat**: AI conversations about uploaded documents
- **File Management**: Upload, remove, and manage documents

### 🎯 Quiz Generation
- **AI-Powered Quizzes**: Generate MCQs from uploaded documents
- **Multiple Difficulty Levels**: Easy, medium, hard quiz options
- **Detailed Explanations**: Correct answer explanations
- **Document Analysis**: AI analysis of document content for quiz suitability

### 🎧 Audio Overviews
- **Podcast-Style Content**: Host and expert conversation format
- **AI-Generated Scripts**: Automatic script generation from documents
- **Educational Content**: Engaging audio explanations

### 🎨 Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Theme support with smooth transitions
- **Framer Motion**: Smooth animations and interactions
- **Styled Components**: Modern CSS-in-JS styling
- **Real-Time Updates**: Live UI updates without page refresh

## 🏗️ Architecture

### Backend (FastAPI + Python)
```
backend/
├── api/                    # API endpoints
│   ├── auth.py            # Authentication endpoints
│   ├── user.py            # User management
│   ├── room.py            # Room management
│   ├── topic.py           # Topic management
│   ├── notes.py           # Notes and document handling
│   ├── chat.py            # Chat functionality
│   ├── quiz.py            # Quiz generation
│   └── audio.py           # Audio overview generation
├── core/                   # Core functionality
│   ├── config.py          # Configuration management
│   ├── database.py        # Database connections
│   ├── security.py        # Security utilities
│   └── websocket.py       # WebSocket implementation
├── models/                 # Database models
│   ├── postgresql/        # PostgreSQL models
│   └── mongodb/           # MongoDB models
├── services/              # Business logic services
│   ├── ai_service.py      # AI integration
│   ├── encryption_service.py # End-to-end encryption
│   └── supabase_service.py # Supabase integration
└── middleware/            # Custom middleware
    ├── auth_middleware.py # Authentication middleware
    └── websocket_auth.py  # WebSocket authentication
```

### Frontend (React + JavaScript)
```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   ├── layout/       # Layout components
│   │   └── personalwork/ # Personal work components
│   ├── context/          # React context
│   ├── themes/           # Theme configuration
│   └── utils/            # Utility functions
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Primary database for user and room data
- **MongoDB**: Document database for chat logs and notes
- **Redis**: Caching and session management
- **WebSockets**: Real-time communication
- **OpenAI API**: AI-powered features
- **JWT**: Authentication tokens
- **Cryptography**: End-to-end encryption

### Frontend
- **React 18**: Modern React with hooks
- **Styled Components**: CSS-in-JS styling
- **Framer Motion**: Animations and transitions
- **React Router**: Client-side routing
- **Socket.io**: WebSocket client
- **React Dropzone**: File upload handling
- **React Toastify**: Notifications

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- MongoDB 4.4+
- Redis 6+
- Google OAuth2 credentials
- OpenAI API key

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-room-collaborator.git
cd ai-room-collaborator
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Environment Configuration
Create a `.env` file in the `backend/` directory:
```env
# Application Settings
SECRET_KEY=your-secret-key-here
DEBUG=True

# Google OAuth2
GOOGLE_OAUTH2_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH2_CLIENT_SECRET=your-google-client-secret

# Database URLs
DATABASE_URL=postgresql://user:password@localhost:5432/airoom
MONGODB_URL=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_KEY=your-openai-api-key

# Encryption
ENCRYPTION_KEY=your-encryption-key

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### Database Setup
```bash
# PostgreSQL
createdb airoom

# MongoDB
# MongoDB will be created automatically when the app starts
```

#### Run Backend
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Environment Configuration
Create a `.env` file in the `frontend/` directory:
```env
REACT_APP_API_URL=http://localhost:8000
```

#### Run Frontend
```bash
cd frontend
npm start
```

## 🔧 Configuration

### Google OAuth2 Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth2 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### OpenAI API Setup
1. Sign up at [OpenAI](https://openai.com/)
2. Get your API key
3. Add to environment variables

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/google/callback` - Handle Google OAuth callback
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/status` - Check authentication status

### Room Endpoints
- `POST /api/room/create` - Create new room
- `POST /api/room/join` - Join room with ID/password
- `POST /api/room/leave` - Leave room
- `GET /api/room/list` - List user's rooms
- `DELETE /api/room/delete` - Delete room (admin only)

### Chat Endpoints
- `GET /ws/{room_id}/{topic_id}` - WebSocket endpoint for real-time chat

### Notes Endpoints
- `POST /api/notes/create` - Create new note
- `POST /api/notes/upload` - Upload document
- `GET /api/notes/list` - List user's notes

## 🔒 Security Features

- **End-to-End Encryption**: All chat messages are encrypted
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configured CORS for security
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting (configurable)
- **HTTPS Only**: Production-ready HTTPS configuration

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment (Render/Heroku)
1. Set environment variables
2. Configure database URLs
3. Deploy using Git integration

### Frontend Deployment (Vercel/Netlify)
1. Set environment variables
2. Configure build settings
3. Deploy using Git integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@airoomcollaborator.com or create an issue in the GitHub repository.

## 🔄 Changelog

### v1.0.0 (Current)
- Initial release
- Google OAuth2 authentication
- Real-time chat with WebSockets
- Room management system
- AI-powered features
- Document analysis and quiz generation
- Audio overview generation
- End-to-end encryption
- Modern responsive UI

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Google for OAuth2 integration
- FastAPI community
- React community
- All contributors and testers 