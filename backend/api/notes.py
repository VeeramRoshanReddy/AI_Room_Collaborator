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
from models.postgresql.note import Note
from models.postgresql.user import User
from models.postgresql.chat_log import ChatLog

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notes", tags=["Notes"])

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

class NoteCreate(BaseModel):
    title: str
    description: Optional[str] = None

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class NoteResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    user_id: str
    uploaded_file_path: Optional[str]
    uploaded_file_name: Optional[str]
    uploaded_file_type: Optional[str]
    uploaded_file_size: Optional[str]
    document_summary: Optional[str]
    quiz_generated: bool
    audio_overview_generated: bool
    has_uploaded_file: bool
    is_active: bool
    created_at: str
    updated_at: Optional[str]

class QuizResponse(BaseModel):
    questions: List[dict]
    total_questions: int
    difficulty: str

class AudioResponse(BaseModel):
    host_script: str
    expert_script: str
    audio_url: Optional[str]

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
    """Upload and process a document for RAG-based QA (persistent)"""
    try:
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in settings.ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not supported. Allowed types: {settings.ALLOWED_FILE_TYPES}"
            )
        file_bytes = await file.read()
        note_id = rag_service.store_note(db, (user.id if hasattr(user, 'id') else user['id']), file_bytes, file.filename, note_title=file.filename)
        # After storing, retrieve chunk_ids (assume stored in Note or another table)
        # chunk_ids = ...
        return {"note_id": note_id, "message": "File uploaded and processed successfully."}
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload and process document.")

@router.post("/{note_id}/ask")
async def ask_note_question(
    note_id: str,
    question: str,
    user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ask a question about an uploaded note (RAG chat)"""
    try:
        # Ensure user owns the note
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == (user.id if hasattr(user, 'id') else user['id'])).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found or access denied.")
        answer = rag_service.query(db, note_id, question, (user.id if hasattr(user, 'id') else user['id']))
        return {"note_id": note_id, "question": question, "answer": answer}
    except Exception as e:
        logger.error(f"Error answering note question: {e}")
        raise HTTPException(status_code=500, detail="Failed to answer question.")

@router.delete("/{note_id}")
async def delete_note_and_vectors(
    note_id: str,
    user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a note and all associated vectors from Pinecone."""
    try:
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == (user.id if hasattr(user, 'id') else user['id'])).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found or access denied.")
        # Retrieve chunk_ids for this note (assume stored in Note or related table)
        chunk_ids = getattr(note, 'chunk_ids', None)
        if chunk_ids:
            rag_service.delete_note_vectors(note_id, (user.id if hasattr(user, 'id') else user['id']), chunk_ids)
        # Delete note and related chat logs
        db.query(ChatLog).filter(ChatLog.note_id == note_id).delete()
        db.delete(note)
        db.commit()
        return {"message": "Note and associated vectors deleted."}
    except Exception as e:
        logger.error(f"Error deleting note: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete note.")

@router.get("/notes")
async def get_user_notes(user: Any = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        mongo_db = get_mongo_db()
        if mongo_db is None:
            raise HTTPException(status_code=500, detail="MongoDB connection not available")
        notes_cursor = mongo_db.notes.find({"user_id": (user.id if hasattr(user, 'id') else user['id'])})
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
        note = await mongo_db.notes.find_one({"_id": file_id, "user_id": (user.id if hasattr(user, 'id') else user['id'])})
        if not note:
            raise HTTPException(status_code=404, detail="Note not found or access denied")
        await mongo_db.notes.delete_one({"_id": file_id, "user_id": (user.id if hasattr(user, 'id') else user['id'])})
        # Delete AI/quiz/audio logs in MongoDB
        await mongo_db.ai_responses.delete_many({"document_id": file_id})
        await mongo_db.quiz_responses.delete_many({"document_id": file_id})
        await mongo_db.audio_responses.delete_many({"document_id": file_id})
        return {"message": "Note and all associated data deleted", "file_id": file_id}
    except Exception as e:
        logger.error(f"Error deleting note: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete note: {str(e)}")

@router.post("/create", response_model=NoteResponse)
async def create_note(
    note_data: NoteCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new note (private to user)"""
    try:
        new_note = Note(
            title=note_data.title,
            description=note_data.description,
            user_id=(current_user['id'] if isinstance(current_user, dict) else current_user.id)
        )
        
        db.add(new_note)
        db.commit()
        db.refresh(new_note)
        
        return NoteResponse(**new_note.to_dict())
        
    except Exception as e:
        logger.error(f"Error creating note: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create note"
        )

@router.get("/my-notes", response_model=List[NoteResponse])
async def get_my_notes(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all notes for the current user"""
    try:
        notes = db.query(Note).filter(
            Note.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id),
            Note.is_active == True
        ).order_by(Note.updated_at.desc()).all()
        if not notes:
            return []
        return [NoteResponse(**note.to_dict()) for note in notes]
    except Exception as e:
        logger.error(f"Error getting user notes: {e}")
        return []

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific note (only owner can access)"""
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id),
            Note.is_active == True
        ).first()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        return NoteResponse(**note.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting note: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get note"
        )

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a note (only owner can update)"""
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id),
            Note.is_active == True
        ).first()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        # Update fields
        if note_data.title is not None:
            note.title = note_data.title
        if note_data.description is not None:
            note.description = note_data.description
        
        note.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(note)
        
        return NoteResponse(**note.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating note: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update note"
        )

@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a note (only owner can delete)"""
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id),
            Note.is_active == True
        ).first()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        # Soft delete
        note.is_active = False
        db.commit()
        
        return {"message": "Note deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting note: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete note"
        )

@router.post("/{note_id}/upload-file")
async def upload_file_to_note(
    note_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file to a note and generate AI summary"""
    try:
        # Check if note exists and user owns it
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id),
            Note.is_active == True
        ).first()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        # Validate file type
        allowed_extensions = ['.pdf', '.doc', '.docx', '.txt']
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Validate file size (10MB limit)
        if file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 10MB"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Upload to Firebase Storage
        file_id = str(uuid.uuid4())
        file_path = f"notes/{((current_user['id'] if isinstance(current_user, dict) else current_user.id))}/{file_id}/{file.filename}"
        
        upload_result = await firebase_service.upload_bytes(
            file_content,
            file_path,
            content_type=file.content_type
        )
        
        # Update note with file information
        note.uploaded_file_path = upload_result["file_path"]
        note.uploaded_file_name = file.filename
        note.uploaded_file_type = file_extension[1:]  # Remove the dot
        note.uploaded_file_size = str(len(file_content))
        note.updated_at = datetime.utcnow()
        
        # Generate AI summary
        try:
            # Extract text from document
            document_text = await ai_service.extract_text_from_document(
                file_content, 
                note.uploaded_file_type
            )
            
            # Generate summary
            summary = await ai_service.generate_document_summary(document_text)
            note.document_summary = summary
            
        except Exception as e:
            logger.error(f"Error generating AI summary: {e}")
            note.document_summary = "Failed to generate summary"
        
        db.commit()
        db.refresh(note)
        
        return {
            "message": "File uploaded successfully",
            "note": NoteResponse(**note.to_dict())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file"
        )

@router.delete("/{note_id}/remove-file")
async def remove_file_from_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove uploaded file from note"""
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id),
            Note.is_active == True
        ).first()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        if not note.uploaded_file_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file uploaded to this note"
            )
        
        # Delete file from Firebase Storage
        try:
            await firebase_service.delete_file(note.uploaded_file_path)
        except Exception as e:
            logger.error(f"Error deleting file from storage: {e}")
        
        # Clear file information
        note.uploaded_file_path = None
        note.uploaded_file_name = None
        note.uploaded_file_type = None
        note.uploaded_file_size = None
        note.document_summary = None
        note.quiz_generated = False
        note.audio_overview_generated = False
        note.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(note)
        
        return {
            "message": "File removed successfully",
            "note": NoteResponse(**note.to_dict())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing file: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove file"
        )

@router.post("/{note_id}/generate-quiz", response_model=QuizResponse)
async def generate_quiz(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate quiz questions from uploaded document"""
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id),
            Note.is_active == True
        ).first()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        if not note.has_file_uploaded():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file uploaded. Please upload a document first."
            )
        
        # Get file content from Firebase
        try:
            file_info = await firebase_service.get_file_info(note.uploaded_file_path)
            if not file_info:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Uploaded file not found"
                )
            
            # Download file content
            temp_path = f"/tmp/{uuid.uuid4()}"
            await firebase_service.download_file(note.uploaded_file_path, temp_path)
            
            with open(temp_path, 'rb') as f:
                file_content = f.read()
            
            # Clean up temp file
            os.remove(temp_path)
            
        except Exception as e:
            logger.error(f"Error accessing uploaded file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to access uploaded file"
            )
        
        # Extract text and generate quiz
        try:
            document_text = await ai_service.extract_text_from_document(
                file_content, 
                note.uploaded_file_type
            )
            
            quiz_questions = await ai_service.generate_quiz_questions(
                document_text,
                num_questions=10,
                difficulty="medium"
            )
            
            # Mark quiz as generated
            note.quiz_generated = True
            db.commit()
            
            return QuizResponse(
                questions=quiz_questions,
                total_questions=len(quiz_questions),
                difficulty="medium"
            )
            
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate quiz"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in quiz generation: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate quiz"
        )

@router.post("/{note_id}/generate-audio", response_model=AudioResponse)
async def generate_audio_overview(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate audio overview script from uploaded document"""
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == (current_user['id'] if isinstance(current_user, dict) else current_user.id),
            Note.is_active == True
        ).first()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        if not note.has_file_uploaded():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file uploaded. Please upload a document first."
            )
        
        # Get file content from Firebase
        try:
            file_info = await firebase_service.get_file_info(note.uploaded_file_path)
            if not file_info:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Uploaded file not found"
                )
            
            # Download file content
            temp_path = f"/tmp/{uuid.uuid4()}"
            await firebase_service.download_file(note.uploaded_file_path, temp_path)
            
            with open(temp_path, 'rb') as f:
                file_content = f.read()
            
            # Clean up temp file
            os.remove(temp_path)
            
        except Exception as e:
            logger.error(f"Error accessing uploaded file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to access uploaded file"
            )
        
        # Extract text and generate audio script
        try:
            document_text = await ai_service.extract_text_from_document(
                file_content, 
                note.uploaded_file_type
            )
            
            audio_script = await ai_service.generate_audio_overview_script(document_text)
            
            # Mark audio as generated
            note.audio_overview_generated = True
            db.commit()
            
            return AudioResponse(
                host_script=audio_script["host_script"],
                expert_script=audio_script["expert_script"]
            )
            
        except Exception as e:
            logger.error(f"Error generating audio script: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate audio overview"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in audio generation: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate audio overview"
        )

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

@router.get("/{note_id}/chat-history")
async def get_note_chat_history(
    note_id: str,
    user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat history for a note (persistent, PostgreSQL)"""
    logs = db.query(ChatLog).filter(ChatLog.note_id == note_id, ChatLog.user_id == (user.id if hasattr(user, 'id') else user['id'])).order_by(ChatLog.created_at).all()
    return [log.to_dict() for log in logs]