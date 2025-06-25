from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Request, WebSocket, WebSocketDisconnect, status
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import os
import uuid
from datetime import datetime
from pydantic import BaseModel
import logging
import json
from sqlalchemy.orm import Session
from core.database import get_db, get_mongo_db
from core.config import settings
from models.mongodb.note import Note as MongoNote
from models.mongodb.ai_response import AIResponse, QuizResponse, AudioResponse
from services.rag_service import rag_service
from services.ai_service import ai_service
from services.encryption_service import encryption_service
from middleware.websocket_auth import get_websocket_user, WebSocketAuthenticationError
from middleware.auth_middleware import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models
class DocumentUpload(BaseModel):
    user_id: str
    file_name: str
    file_type: str

class DocumentQuery(BaseModel):
    file_id: str
    user_id: str
    question: str

class DocumentInfo(BaseModel):
    file_id: str
    user_id: str
    file_name: str
    file_type: str
    chunk_count: int
    total_tokens: int
    upload_date: datetime
    status: str

class QueryResponse(BaseModel):
    answer: str
    context_chunks: List[str]
    file_id: str
    question: str
    confidence: float
    processing_time: float

# In-memory document storage (replace with database in production)
documents: Dict[str, Dict] = {}

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            try:
                self.active_connections[room_id].remove(websocket)
                if not self.active_connections[room_id]:
                    del self.active_connections[room_id]
            except ValueError:
                # Connection already removed
                pass

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

    async def broadcast(self, message: str, room_id: str, exclude_websocket: WebSocket = None):
        if room_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[room_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_text(message)
                    except Exception as e:
                        logger.error(f"Error broadcasting message: {e}")
                        disconnected.append(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                try:
                    self.active_connections[room_id].remove(conn)
                except ValueError:
                    # Connection already removed
                    pass

manager = ConnectionManager()

# API Endpoints
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and process a document for RAG-based QA"""
    try:
        # Validate file type
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in settings.ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not supported. Allowed types: {settings.ALLOWED_FILE_TYPES}"
            )
        
        # Validate file size
        if file.size and file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE} bytes"
            )
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        
        # Create upload directory if it doesn't exist
        upload_dir = settings.UPLOAD_DIR
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_dir, f"{file_id}_{file.filename}")
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process document with RAG service
        processing_result = await rag_service.process_document(
            file_path=file_path,
            file_id=file_id,
            user_id=user.id
        )
        
        # Store document info
        document_info = {
            "file_id": file_id,
            "user_id": user.id,
            "file_name": file.filename,
            "file_type": file_extension,
            "file_path": file_path,
            "chunk_count": processing_result["chunks_processed"],
            "total_tokens": 0,  # Will be updated by RAG service
            "upload_date": datetime.now(),
            "status": "processed",
            "file_size": file.size
        }
        
        documents[file_id] = document_info
        
        # Get detailed info from RAG service
        rag_info = await rag_service.get_document_info(file_id)
        if rag_info:
            document_info["total_tokens"] = rag_info["total_tokens"]
        
        return {
            "file_id": file_id,
            "file_name": file.filename,
            "status": "success",
            "chunks_processed": processing_result["chunks_processed"],
            "message": "Document uploaded and processed successfully"
        }
    
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@router.post("/query")
async def query_document(
    file_id: str, 
    question: str, 
    user: Any = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Query a document with a question using RAG. Only answers based on file content."""
    try:
        mongo_db = get_mongo_db()
        if mongo_db is None:
            raise HTTPException(status_code=500, detail="MongoDB connection not available")
        note = await mongo_db.notes.find_one({"_id": file_id, "user_id": user.id})
        if not note:
            raise HTTPException(status_code=404, detail="Document not found or access denied")
        start_time = datetime.now()
        rag_response = await rag_service.query_document(
            file_id=file_id,
            question=question,
            user_id=user.id
        )
        processing_time = (datetime.now() - start_time).total_seconds()
        # If RAG cannot answer, reply 'Out of scope'
        if not rag_response["answer"] or rag_response["answer"].strip().lower() == "out of scope":
            return {
                "answer": "Out of scope", 
                "context_chunks": [], 
                "file_id": file_id, 
                "question": question, 
                "confidence": 0.0, 
                "processing_time": processing_time
            }
        return {
            "answer": rag_response["answer"],
            "context_chunks": rag_response["context_chunks"],
            "file_id": file_id,
            "question": question,
            "confidence": min(1.0, len(rag_response["context_chunks"]) / 3.0),
            "processing_time": processing_time
        }
    except Exception as e:
        logger.error(f"Error querying document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to query document: {str(e)}")

@router.get("/notes")
async def get_user_notes(user: Any = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        mongo_db = get_mongo_db()
        if mongo_db is None:
            raise HTTPException(status_code=500, detail="MongoDB connection not available")
        notes_cursor = mongo_db.notes.find({"user_id": user.id})
        notes = []
        async for note in notes_cursor:
            note["_id"] = str(note["_id"])
            notes.append(note)
        return {"notes": notes}
    except Exception as e:
        logger.error(f"Error fetching user notes: {e}")
        return {"notes": [], "detail": f"Failed to fetch notes: {str(e)}"}

@router.delete("/note/{file_id}")
async def delete_note(file_id: str, user: Any = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a note and all associated AI/quiz/audio logs."""
    try:
        mongo_db = get_mongo_db()
        if mongo_db is None:
            raise HTTPException(status_code=500, detail="MongoDB connection not available")
        note = await mongo_db.notes.find_one({"_id": file_id, "user_id": user.id})
        if not note:
            raise HTTPException(status_code=404, detail="Note not found or access denied")
        await mongo_db.notes.delete_one({"_id": file_id, "user_id": user.id})
        # Delete AI/quiz/audio logs in MongoDB
        await mongo_db.ai_responses.delete_many({"document_id": file_id})
        await mongo_db.quiz_responses.delete_many({"document_id": file_id})
        await mongo_db.audio_responses.delete_many({"document_id": file_id})
        # Clean up from in-memory storage
        if file_id in documents:
            del documents[file_id]
        return {"message": "Note and all associated data deleted", "file_id": file_id}
    except Exception as e:
        logger.error(f"Error deleting note: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete note: {str(e)}")

@router.post("/create")
async def create_text_note(
    data: Dict[str, Any],
    user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new text note (not file upload)."""
    try:
        title = data.get("title")
        description = data.get("description", "")
        if not title:
            raise HTTPException(status_code=400, detail="Note title required")
        note_doc = {
            "title": title,
            "content": description,
            "user_id": user.id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "tags": [],
            "is_public": False,
            "is_archived": False,
        }
        mongo_db = get_mongo_db()
        if mongo_db is None:
            raise HTTPException(status_code=500, detail="MongoDB connection not available")
        result = await mongo_db.notes.insert_one(note_doc)
        note_doc["_id"] = str(result.inserted_id)
        return {"note": note_doc, "message": "Note created"}
    except Exception as e:
        logger.error(f"Error creating note: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create note: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check for the notes service"""
    return {
        "status": "healthy",
        "service": "notes",
        "timestamp": datetime.now().isoformat(),
        "encryption_enabled": settings.CHAT_ENCRYPTION_ENABLED,
        "active_websocket_rooms": len(manager.active_connections),
        "total_websocket_connections": sum(len(connections) for connections in manager.active_connections.values())
    }

@router.api_route('/{full_path:path}', methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def catch_all_notes(full_path: str, request: Request):
    return JSONResponse(status_code=status.HTTP_405_METHOD_NOT_ALLOWED, content={"detail": "Method not allowed", "path": f"/api/notes/{full_path}"})