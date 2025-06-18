# AI Features Setup Guide

This guide will help you set up the AI features for your AI Room Collaborator project, including end-to-end encrypted group chat and file-based question answering.

## 🚀 Features Overview

### 1. Group Chat (Rooms/Topics) - Open-ended AI Chatbot
- **Purpose**: General brainstorming, group assistance, open Q&A
- **AI Behavior**: Classic chatbot using system prompt + chat history
- **Security**: End-to-end encrypted messages
- **API**: OpenAI GPT-4, Gemini, Claude, etc.

### 2. Notes Section (Personal Work) - File-Bound QA Bot
- **Purpose**: Strictly limited to uploaded file content only
- **AI Behavior**: Retrieval-Augmented Generation (RAG) for accurate answers
- **Security**: File content encryption
- **Goal**: No hallucination, answers only from document content

## 🔧 Setup Instructions

### Step 1: Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# Encryption Settings (REQUIRED)
ENCRYPTION_KEY=your-32-character-encryption-key-here
CHAT_ENCRYPTION_ENABLED=true

# Database Settings
DATABASE_URL=postgresql://postgres:password@localhost:5432/dbname
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=ai_learning_platform

# Other settings...
```

### Step 2: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Generate Encryption Key

Generate a secure 32-character encryption key:

```python
import secrets
import string

# Generate a 32-character random string
alphabet = string.ascii_letters + string.digits + string.punctuation
encryption_key = ''.join(secrets.choice(alphabet) for i in range(32))
print(f"ENCRYPTION_KEY={encryption_key}")
```

### Step 4: OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key and add it to your `.env` file

## 🔐 Security Features

### End-to-End Encryption

All chat messages are encrypted using Fernet (AES-128-CBC):

- **Message Encryption**: Each message is encrypted with room-specific context
- **File Encryption**: Uploaded documents are encrypted before storage
- **Key Management**: Encryption keys are derived from room and user context
- **Cross-Room Protection**: Messages cannot be decrypted across different rooms

### API Key Security

- **Environment Variables**: API keys are stored in `.env` files (not in code)
- **Git Ignore**: `.env` files are excluded from version control
- **Production**: Use secure secret management in production

## 📁 File Upload & Processing

### Supported File Types
- **PDF**: `.pdf` files
- **Word Documents**: `.docx`, `.doc` files
- **Text Files**: `.txt`, `.md` files

### Processing Pipeline
1. **Upload**: File is uploaded and validated
2. **Text Extraction**: Text is extracted from the document
3. **Chunking**: Text is split into 1000-word chunks with 200-word overlap
4. **Embedding**: Each chunk is converted to vector embeddings
5. **Storage**: Embeddings are stored in vector database
6. **Query**: Questions are answered using RAG approach

## 🤖 AI Models & Configuration

### Group Chat Configuration
```python
# System prompt for group chat
system_prompt = """You are an educational assistant helping students discuss classroom topics. 
Engage helpfully in group discussions by:
1. Providing relevant insights and explanations
2. Asking clarifying questions when needed
3. Encouraging collaborative thinking
4. Being supportive and educational
5. Staying on topic and contributing meaningfully to the conversation

Respond naturally as if you're part of the group discussion."""
```

### Notes QA Configuration
```python
# System prompt for file-based QA
system_prompt = """You are a strict document assistant. You must answer questions ONLY based on the provided document content. 

IMPORTANT RULES:
1. Only use information from the provided document context
2. If the answer is not in the document, say "I don't know"
3. Do not use any external knowledge
4. Be precise and accurate
5. If you're unsure, say so"""
```

## 🔌 API Endpoints

### Group Chat Endpoints

#### WebSocket Connection
```
ws://localhost:8000/api/chat/ws/{room_id}/{user_id}
```

#### REST API Endpoints
```
POST /api/chat/send - Send a message
POST /api/chat/ai/chat - Generate AI response
GET /api/chat/history/{room_id} - Get chat history
DELETE /api/chat/history/{room_id} - Clear chat history
```

### Notes Endpoints

```
POST /api/notes/upload - Upload document
POST /api/notes/query - Query document
GET /api/notes/documents/{user_id} - Get user documents
GET /api/notes/document/{file_id} - Get document info
DELETE /api/notes/document/{file_id} - Delete document
POST /api/notes/document/{file_id}/summary - Generate summary
```

## 🧪 Testing the Setup

### Test Group Chat

1. **Start the backend**:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Test WebSocket connection**:
   ```javascript
   const ws = new WebSocket('ws://localhost:8000/api/chat/ws/room1/user1');
   
   ws.onopen = () => {
     // Join room
     ws.send(JSON.stringify({
       type: 'join_room'
     }));
   };
   
   ws.onmessage = (event) => {
     const data = JSON.parse(event.data);
     console.log('Received:', data);
   };
   
   // Send a message
   ws.send(JSON.stringify({
     type: 'chat',
     content: 'Hello, this is a test message!'
   }));
   
   // Request AI response
   ws.send(JSON.stringify({
     type: 'ai_request',
     content: 'Can you help me understand machine learning?'
   }));
   ```

### Test Notes QA

1. **Upload a document**:
   ```bash
   curl -X POST "http://localhost:8000/api/notes/upload" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@your_document.pdf" \
     -F "user_id=user1"
   ```

2. **Query the document**:
   ```bash
   curl -X POST "http://localhost:8000/api/notes/query" \
     -H "Content-Type: application/json" \
     -d '{
       "file_id": "your_file_id",
       "user_id": "user1",
       "question": "What is the main topic of this document?"
     }'
   ```

## 🚨 Troubleshooting

### Common Issues

1. **"OpenAI API key not found"**
   - Check that `OPENAI_API_KEY` is set in your `.env` file
   - Verify the key is valid and has sufficient credits

2. **"Encryption key error"**
   - Ensure `ENCRYPTION_KEY` is exactly 32 characters
   - Generate a new key if needed

3. **"File upload failed"**
   - Check file size (max 10MB)
   - Verify file type is supported
   - Ensure upload directory exists

4. **"WebSocket connection failed"**
   - Check that the backend is running
   - Verify the WebSocket URL is correct
   - Check CORS settings

### Performance Optimization

1. **Reduce API costs**:
   - Lower `OPENAI_MAX_TOKENS` for shorter responses
   - Increase `OPENAI_TEMPERATURE` for more creative responses
   - Use caching for repeated queries

2. **Improve response time**:
   - Use smaller chunk sizes for documents
   - Implement response caching
   - Use async processing for large files

## 🔄 Deployment

### Environment Variables for Production

```env
# Production settings
DEBUG=false
CHAT_ENCRYPTION_ENABLED=true
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1500
OPENAI_TEMPERATURE=0.5

# Use secure secret management
OPENAI_API_KEY=your-production-api-key
ENCRYPTION_KEY=your-production-encryption-key
```

### Security Checklist

- [ ] API keys are stored securely (not in code)
- [ ] Encryption is enabled
- [ ] CORS is configured for production domains
- [ ] File upload limits are set
- [ ] Rate limiting is implemented
- [ ] HTTPS is enabled
- [ ] Database connections are secure

## 📊 Monitoring

### Key Metrics to Monitor

1. **API Usage**: Track OpenAI API calls and costs
2. **Response Times**: Monitor AI response generation time
3. **Error Rates**: Track failed requests and errors
4. **File Processing**: Monitor document upload and processing success
5. **Encryption**: Verify encryption/decryption success rates

### Logging

The system logs important events:
- API requests and responses
- File uploads and processing
- Encryption/decryption operations
- Error messages and stack traces

Check logs for debugging and monitoring:
```bash
tail -f backend/logs/app.log
```

## 🎯 Next Steps

1. **Implement database persistence** for chat history and documents
2. **Add user authentication** and authorization
3. **Implement rate limiting** to prevent abuse
4. **Add file compression** for large documents
5. **Implement caching** for frequently accessed data
6. **Add analytics** and usage tracking
7. **Implement backup** and recovery procedures

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs for error messages
3. Verify all environment variables are set correctly
4. Test with a simple example first
5. Check OpenAI API status and credits

For additional help, refer to the main README.md file or create an issue in the project repository. 