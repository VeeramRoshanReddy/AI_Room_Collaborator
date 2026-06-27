from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Request, status
from fastapi.responses import JSONResponse
from typing import List, Optional
import os
import uuid
from datetime import datetime
from pydantic import BaseModel
import logging
from sqlalchemy.orm import Session
from core.database import get_db, get_mongo_db
from core.config import settings
from services.rag_service import rag_service
from services.ai_service import ai_service
from services.storage_service import storage_service
from middleware.auth_middleware import get_current_user
from models.postgresql.note import Note
from models.postgresql.user import User as PGUser
from models.postgresql.chat_log import ChatLog

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notes", tags=["Notes"])

# Pydantic models
class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None
    description: Optional[str] = None

class AskQuestion(BaseModel):
    question: str

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

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

# API Endpoints
@router.post("/{note_id}/ask")
async def ask_note_question(
    note_id: str,
    body: AskQuestion,
    user: PGUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ask a question about an uploaded note (RAG chat)"""
    try:
        question = body.question.strip()
        if not question:
            raise HTTPException(status_code=400, detail="Question is required.")
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == user.id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found or access denied.")
        answer = rag_service.query(db, note_id, question, user.id)
        return {"note_id": note_id, "question": question, "answer": answer}
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error answering note question: {e}")
        raise HTTPException(status_code=500, detail="Failed to answer question.")

@router.post("/create", response_model=NoteResponse)
async def create_note(
    note_data: NoteCreate,
    current_user: PGUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new note"""
    try:
        new_note = Note(
            title=note_data.title,
            content=note_data.content or note_data.description,
            user_id=current_user.id
        )
        
        db.add(new_note)
        db.commit()
        db.refresh(new_note)
        
        # Convert to response format
        note_dict = new_note.to_dict()
        note_dict["description"] = note_dict.pop("content", None)  # Map content to description for frontend
        
        return NoteResponse(**note_dict)
        
    except Exception as e:
        logger.error(f"Error creating note: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create note"
        )

@router.get("/my-notes", response_model=List[NoteResponse])
async def get_my_notes(
    current_user: PGUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all notes for the current user"""
    try:
        notes = db.query(Note).filter(
            Note.user_id == current_user.id,
            Note.is_active == True
        ).all()
        
        # Convert to response format
        note_responses = []
        for note in notes:
            note_dict = note.to_dict()
            note_dict["description"] = note_dict.pop("content", None)  # Map content to description for frontend
            note_responses.append(NoteResponse(**note_dict))
        
        return note_responses
        
    except Exception as e:
        logger.error(f"Error getting user notes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get notes"
        )

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    current_user: PGUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific note by ID"""
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == current_user.id,
            Note.is_active == True
        ).first()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        # Convert to response format
        note_dict = note.to_dict()
        note_dict["description"] = note_dict.pop("content", None)  # Map content to description for frontend
        
        return NoteResponse(**note_dict)
        
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
    current_user: PGUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a note (only owner can update)"""
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == current_user.id,
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
        if note_data.content is not None:
            note.content = note_data.content
        
        note.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(note)
        
        # Convert to response format
        note_dict = note.to_dict()
        note_dict["description"] = note_dict.pop("content", None)  # Map content to description for frontend
        
        return NoteResponse(**note_dict)
        
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
    current_user: PGUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a note (only owner can delete)"""
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == current_user.id,
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
    current_user: PGUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file to a note and generate AI summary"""
    try:
        # Check if note exists and user owns it
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == current_user.id,
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

        # Upload to S3
        file_id = str(uuid.uuid4())
        file_path = f"notes/{current_user.id}/{file_id}/{file.filename}"
        await storage_service.upload_bytes(file_content, file_path, content_type=file.content_type)

        # Update note with file information
        note.uploaded_file_path = file_path
        note.uploaded_file_name = file.filename
        note.uploaded_file_type = file_extension[1:]  # Remove the dot
        note.uploaded_file_size = str(len(file_content))
        note.updated_at = datetime.utcnow()

        # Generate AI summary and make the document queryable via RAG
        try:
            document_text = await ai_service.extract_text_from_document(
                file_content,
                note.uploaded_file_type
            )

            summary = await ai_service.generate_document_summary(document_text)
            note.document_summary = summary

            # Embedding failures (quota, network, Pinecone outage, etc.) should
            # never clobber a summary that already generated successfully.
            try:
                rag_service.embed_and_store_chunks(note_id, current_user.id, document_text)
            except Exception as e:
                logger.warning(f"Skipping RAG embedding for note {note_id}: {e}")

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
    current_user: PGUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove uploaded file from note"""
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == current_user.id,
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
        
        # Delete file from S3
        try:
            await storage_service.delete_file(note.uploaded_file_path)
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
    current_user: PGUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate quiz questions from uploaded document"""
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == current_user.id,
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
        
        # Get file content from S3
        try:
            file_info = await storage_service.get_file_info(note.uploaded_file_path)
            if not file_info:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Uploaded file not found"
                )
            file_content = await storage_service.download_file(note.uploaded_file_path)
        except HTTPException:
            raise
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
    current_user: PGUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate audio overview script from uploaded document"""
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == current_user.id,
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
        
        # Get file content from S3
        try:
            file_info = await storage_service.get_file_info(note.uploaded_file_path)
            if not file_info:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Uploaded file not found"
                )
            file_content = await storage_service.download_file(note.uploaded_file_path)
        except HTTPException:
            raise
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
    }

@router.get("/{note_id}/chat-history")
async def get_note_chat_history(
    note_id: str,
    user: PGUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat history for a note (persistent, PostgreSQL)"""
    logs = db.query(ChatLog).filter(ChatLog.note_id == note_id, ChatLog.user_id == user.id).order_by(ChatLog.created_at).all()
    return [log.to_dict() for log in logs]

@router.api_route('/{full_path:path}', methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def catch_all_notes(full_path: str, request: Request):
    return JSONResponse(status_code=status.HTTP_405_METHOD_NOT_ALLOWED, content={"detail": "Method not allowed", "path": f"/api/notes/{full_path}"})