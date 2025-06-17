# AI Room Collaborator

A real-time collaborative platform that combines AI assistance with room-based collaboration, built with React frontend and FastAPI backend.

## 🚀 Features

- **Real-time Collaboration**: Multiple users can collaborate in real-time rooms
- **AI Integration**: AI-powered assistance for enhanced productivity
- **User Authentication**: Secure authentication with Google OAuth and Firebase
- **File Sharing**: Drag-and-drop file sharing capabilities
- **Responsive Design**: Modern, responsive UI built with styled-components
- **WebSocket Communication**: Real-time updates and messaging

## 🏗️ Project Structure

```
AI_Room_Collaborator/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── layout/      # Layout components (Navbar, Sidebar)
│   │   │   └── personalwork/ # Main application components
│   │   └── themes/          # Styling themes
│   └── public/              # Static assets
├── backend/                  # FastAPI backend application
│   ├── core/                # Core configuration and utilities
│   ├── models/              # Database models (MongoDB & PostgreSQL)
│   ├── services/            # Business logic services
│   └── main.py              # FastAPI application entry point
└── vercel.json              # Vercel deployment configuration
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Styled Components** - CSS-in-JS styling
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **Firebase** - Authentication and real-time database
- **Framer Motion** - Animations
- **React Dropzone** - File upload handling

### Backend
- **FastAPI** - Python web framework
- **PostgreSQL** - Primary database
- **MongoDB** - Document database for chat logs and AI responses
- **WebSocket** - Real-time communication
- **Supabase** - Database and authentication services
- **Firebase** - Additional authentication and services

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- PostgreSQL database
- MongoDB database

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory with your environment variables:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost/dbname
   MONGODB_URL=mongodb://localhost:27017/ai_room_collaborator
   SECRET_KEY=your_secret_key
   FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

5. Run the backend server:
   ```bash
   uvicorn main:app --reload
   ```

## 🌐 Deployment

### Vercel Deployment (Frontend)

The project is configured for Vercel deployment. The `vercel.json` file contains the necessary configuration:

- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/build`
- **Framework**: `create-react-app`

To deploy:
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the configuration and deploy
3. Set up environment variables in Vercel dashboard

### Backend Deployment

For the backend, you can deploy to platforms like:
- **Railway**
- **Heroku**
- **DigitalOcean App Platform**
- **AWS Elastic Beanstalk**

## 🔧 Environment Variables

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (.env)
```env
DATABASE_URL=postgresql://username:password@localhost/dbname
MONGODB_URL=mongodb://localhost:27017/ai_room_collaborator
SECRET_KEY=your_secret_key
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## 📝 API Documentation

Once the backend is running, you can access the interactive API documentation at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/VeeramRoshanReddy/AI_Room_Collaborator/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

## 🔮 Roadmap

- [ ] Enhanced AI capabilities
- [ ] Mobile app development
- [ ] Advanced file management
- [ ] Team collaboration features
- [ ] Analytics and insights
- [ ] Multi-language support 