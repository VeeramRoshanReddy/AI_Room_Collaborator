# AI Room Collaborator 🚀

A comprehensive platform for collaborative learning with AI-powered features, real-time chat, document analysis, and interactive learning tools.

## 🌟 Features

### 🔐 Authentication
- **Multiple Auth Methods**: Google OAuth2, Supabase Auth, Email/Password
- **Secure JWT Tokens**: Bearer token authentication
- **User Management**: Profile pictures, verification, and account management

### 🏠 Collaborative Rooms
- **8-Digit Room IDs**: Easy-to-share room identifiers
- **Room Passwords**: Secure access control
- **Admin Management**: Promote members, remove participants
- **Real-time Updates**: Live participant status

### 📚 Topics & Discussions
- **Topic Creation**: Any room member can create topics
- **Focused Discussions**: Organized conversations within rooms
- **Permission Control**: Only creators and admins can delete topics

### 💬 Real-time Chat
- **WebSocket Support**: Instant message delivery
- **End-to-End Encryption**: Secure message transmission
- **AI Chatbot**: @chatbot integration for AI assistance
- **Message Persistence**: All chats stored in database
- **Typing Indicators**: Real-time user activity

### 📝 Personal Notes
- **Private Workspace**: Each user's notes are private
- **File Upload**: Support for PDF, DOC, DOCX files
- **AI Document Analysis**: Automatic summaries and insights
- **Quiz Generation**: AI-powered MCQs from documents
- **Audio Overviews**: Podcast-style document explanations

### 🤖 AI Features
- **Document Summarization**: Intelligent content extraction
- **Quiz Generation**: Contextual multiple-choice questions
- **Audio Scripts**: Host-expert dialogue generation
- **Chatbot Integration**: Context-aware AI responses

## 🏗️ Architecture

### Database Design
- **PostgreSQL (Neon)**: User data, rooms, topics, notes
- **MongoDB**: Chat logs, AI responses, document metadata
- **Redis**: Real-time features, caching, session management

### Security
- **End-to-End Encryption**: Fernet encryption for messages
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access**: Admin and member permissions
- **Input Validation**: Comprehensive data validation

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- PostgreSQL database
- MongoDB database
- Redis server
- Google OAuth2 credentials
- Supabase project
- OpenAI API key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-room-collaborator.git
cd ai-room-collaborator
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Environment Configuration
Create `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/airoom
MONGODB_URL=mongodb://localhost:27017/airoom
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ENCRYPTION_KEY=your-32-byte-fernet-key

# Google OAuth2
GOOGLE_OAUTH2_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH2_CLIENT_SECRET=your-google-client-secret

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Firebase (for file storage)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id

# Application Settings
DEBUG=False
ALLOWED_ORIGINS=["https://yourdomain.com", "http://localhost:3000"]
ALLOWED_HOSTS=["yourdomain.com", "localhost"]
MAX_FILE_SIZE=10485760  # 10MB
```

#### Generate Encryption Key
```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
```

#### Database Migration
```bash
# Initialize database tables
python -c "from core.database import init_db; init_db()"
```

#### Run the Backend
```bash
uvicorn main:app --host=0.0.0.0 --port=8000 --reload
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Environment Configuration
Create `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Run the Frontend
```bash
npm start
```

## 📚 API Documentation

### Authentication Endpoints

#### Sign Up
```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Google OAuth2
```http
POST /api/v1/auth/google
Content-Type: application/json

{
  "token": "google-id-token"
}
```

### Room Management

#### Create Room
```http
POST /api/v1/rooms/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Study Group",
  "description": "Weekly study session"
}
```

#### Join Room
```http
POST /api/v1/rooms/join
Authorization: Bearer <token>
Content-Type: application/json

{
  "room_id": "12345678",
  "password": "87654321"
}
```

### Topic Management

#### Create Topic
```http
POST /api/v1/topics/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Chapter 5 Discussion",
  "description": "Let's discuss the key concepts",
  "room_id": "room-uuid"
}
```

### Notes Management

#### Create Note
```http
POST /api/v1/notes/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Study Notes",
  "content": "Important concepts..."
}
```

#### Upload File
```http
POST /api/v1/notes/{note_id}/upload-file
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file-upload>
```

### WebSocket Endpoints

#### Group Chat
```javascript
const ws = new WebSocket(`ws://localhost:8000/api/v1/chat/group/${roomId}/${topicId}?token=${jwtToken}`);
```

#### Note Chat
```javascript
const ws = new WebSocket(`ws://localhost:8000/api/v1/chat/note/${noteId}?token=${jwtToken}`);
```

## 🔧 Development

### Project Structure
```
ai-room-collaborator/
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
│   │   ├── utils/          # Utility functions
│   │   └── themes/         # UI themes
│   └── package.json
└── README.md
```

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Formatting
```bash
# Backend
cd backend
black .
flake8 .

# Frontend
cd frontend
npm run format
```

## 🚀 Deployment

### Backend Deployment (Render)

1. **Create Render Account**: Sign up at [render.com](https://render.com)

2. **Connect Repository**: Link your GitHub repository

3. **Configure Environment**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host=0.0.0.0 --port=$PORT`
   - **Environment Variables**: Add all variables from `.env`

4. **Database Setup**:
   - Create PostgreSQL database on Render
   - Create MongoDB database (MongoDB Atlas)
   - Create Redis instance (Redis Cloud)

### Frontend Deployment (Vercel)

1. **Create Vercel Account**: Sign up at [vercel.com](https://vercel.com)

2. **Import Project**: Connect your GitHub repository

3. **Configure Environment Variables**: Add frontend environment variables

4. **Deploy**: Vercel will automatically deploy on push to main branch

### Environment Variables for Production

#### Backend (Render)
```env
DATABASE_URL=postgresql://user:password@host:port/database
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/database
REDIS_URL=redis://user:password@host:port
SECRET_KEY=your-production-secret-key
ENCRYPTION_KEY=your-production-encryption-key
DEBUG=False
ALLOWED_ORIGINS=["https://yourdomain.com"]
```

#### Frontend (Vercel)
```env
REACT_APP_API_URL=https://your-backend.onrender.com/api/v1
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🔒 Security Considerations

### Authentication
- JWT tokens with secure expiration
- Password hashing with bcrypt
- OAuth2 integration for third-party auth

### Data Protection
- End-to-end encryption for chat messages
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### API Security
- Rate limiting
- CORS configuration
- Request validation
- Error handling without information leakage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use TypeScript for frontend components
- Write comprehensive tests
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [API Docs](https://yourdomain.com/docs)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-room-collaborator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-room-collaborator/discussions)

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- React for the frontend framework
- OpenAI for AI capabilities
- Supabase for authentication and database
- All contributors and users

---

**Made with ❤️ for collaborative learning** 