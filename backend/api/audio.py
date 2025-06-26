from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from pydantic import BaseModel
from core.database import get_db, get_mongo_db
from middleware.auth_middleware import get_current_user
from models.postgresql.note import Note
from models.mongodb.ai_response import AudioResponse
from services.ai_service import ai_service
from datetime import datetime
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/audio", tags=["Audio"])

# Pydantic models
class AudioGenerateRequest(BaseModel):
    note_id: str
    voice_id: Optional[str] = None

class AudioResponse(BaseModel):
    id: str
    note_id: str
    user_id: str
    host_script: str
    expert_script: str
    audio_url: Optional[str] = None
    status: str
    created_at: str

class AudioStatus(BaseModel):
    id: str
    status: str
    progress: Optional[int] = None
    message: Optional[str] = None

@router.post("/generate", response_model=AudioResponse)
async def generate_audio_overview(
    request: AudioGenerateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate an audio overview from a note's content"""
    try:
        # Check if note exists and user owns it
        note = db.query(Note).filter(
            Note.id == request.note_id,
            Note.user_id == current_user["id"],
            Note.is_active == True
        ).first()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found or access denied"
            )
        
        if not note.has_file_uploaded():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Note must have an uploaded file to generate audio overview"
            )
        
        # Get document content for audio generation
        document_content = note.content or ""
        if not document_content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Note must have content to generate audio overview"
            )
        
        # Generate audio script using AI service
        script = await ai_service.generate_audio_overview_script(document_content)
        
        if not script or not script.get("host_script") or not script.get("expert_script"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate audio script"
            )
        
        # Store audio response in MongoDB
        mongo_db = get_mongo_db()
        audio_data = AudioResponse(
            note_id=request.note_id,
            user_id=current_user["id"],
            host_script=script["host_script"],
            expert_script=script["expert_script"],
            status="generated"
        )
        
        result = await mongo_db.audio_responses.insert_one(audio_data.dict())
        audio_data.id = str(result.inserted_id)
        
        # Update note to mark audio as generated
        note.audio_overview_generated = True
        db.commit()
        
        return AudioResponse(
            id=audio_data.id,
            note_id=audio_data.note_id,
            user_id=audio_data.user_id,
            host_script=audio_data.host_script,
            expert_script=audio_data.expert_script,
            audio_url=audio_data.audio_url,
            status=audio_data.status,
            created_at=audio_data.created_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating audio overview: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate audio overview"
        )

@router.post("/{audio_id}/synthesize")
async def synthesize_audio(
    audio_id: str,
    current_user: dict = Depends(get_current_user),
    mongo_db = Depends(get_mongo_db)
):
    """Synthesize audio from generated script"""
    try:
        # Get audio response
        audio = await mongo_db.audio_responses.find_one({
            "_id": audio_id,
            "user_id": current_user["id"]
        })
        
        if not audio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio not found or access denied"
            )
        
        if audio["status"] != "generated":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio script must be generated before synthesis"
            )
        
        # Update status to processing
        await mongo_db.audio_responses.update_one(
            {"_id": audio_id},
            {"$set": {"status": "processing"}}
        )
        
        # Here you would integrate with ElevenLabs or another TTS service
        # For now, we'll simulate the process
        try:
            # Simulate audio synthesis
            # In a real implementation, you would:
            # 1. Call ElevenLabs API with the script
            # 2. Get the audio file URL
            # 3. Store the URL in the database
            
            # For demo purposes, we'll just update the status
            audio_url = f"/api/audio/{audio_id}/download"  # Placeholder URL
            
            await mongo_db.audio_responses.update_one(
                {"_id": audio_id},
                {
                    "$set": {
                        "status": "completed",
                        "audio_url": audio_url
                    }
                }
            )
            
            return {
                "message": "Audio synthesis started",
                "audio_id": audio_id,
                "status": "processing"
            }
            
        except Exception as e:
            # Update status to failed
            await mongo_db.audio_responses.update_one(
                {"_id": audio_id},
                {"$set": {"status": "failed"}}
            )
            raise e
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error synthesizing audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to synthesize audio"
        )

@router.get("/{audio_id}/status", response_model=AudioStatus)
async def get_audio_status(
    audio_id: str,
    current_user: dict = Depends(get_current_user),
    mongo_db = Depends(get_mongo_db)
):
    """Get the status of audio synthesis"""
    try:
        audio = await mongo_db.audio_responses.find_one({
            "_id": audio_id,
            "user_id": current_user["id"]
        })
        
        if not audio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio not found or access denied"
            )
        
        return AudioStatus(
            id=str(audio["_id"]),
            status=audio["status"],
            progress=audio.get("progress"),
            message=audio.get("message")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting audio status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get audio status"
        )

@router.get("/note/{note_id}", response_model=List[AudioResponse])
async def get_note_audio(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all audio overviews for a specific note"""
    try:
        # Check if note exists and user owns it
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == current_user["id"],
            Note.is_active == True
        ).first()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found or access denied"
            )
        
        # Get audio responses from MongoDB
        mongo_db = get_mongo_db()
        audio_list = await mongo_db.audio_responses.find({
            "note_id": note_id,
            "user_id": current_user["id"]
        }).sort("created_at", -1).to_list(length=50)
        
        return [
            AudioResponse(
                id=str(audio["_id"]),
                note_id=audio["note_id"],
                user_id=audio["user_id"],
                host_script=audio["host_script"],
                expert_script=audio["expert_script"],
                audio_url=audio.get("audio_url"),
                status=audio["status"],
                created_at=audio["created_at"].isoformat()
            )
            for audio in audio_list
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting note audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get audio overviews"
        )

@router.get("/{audio_id}", response_model=AudioResponse)
async def get_audio(
    audio_id: str,
    current_user: dict = Depends(get_current_user),
    mongo_db = Depends(get_mongo_db)
):
    """Get a specific audio overview by ID"""
    try:
        audio = await mongo_db.audio_responses.find_one({
            "_id": audio_id,
            "user_id": current_user["id"]
        })
        
        if not audio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio not found or access denied"
            )
        
        return AudioResponse(
            id=str(audio["_id"]),
            note_id=audio["note_id"],
            user_id=audio["user_id"],
            host_script=audio["host_script"],
            expert_script=audio["expert_script"],
            audio_url=audio.get("audio_url"),
            status=audio["status"],
            created_at=audio["created_at"].isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get audio"
        )

@router.delete("/{audio_id}")
async def delete_audio(
    audio_id: str,
    current_user: dict = Depends(get_current_user),
    mongo_db = Depends(get_mongo_db)
):
    """Delete an audio overview"""
    try:
        result = await mongo_db.audio_responses.delete_one({
            "_id": audio_id,
            "user_id": current_user["id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio not found or access denied"
            )
        
        return {"message": "Audio overview deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete audio overview"
        )

@router.get("/")
async def audio_root():
    """Audio API root endpoint"""
    return {
        "message": "Audio API v1.0",
        "endpoints": {
            "generate": "POST /audio/generate",
            "synthesize": "POST /audio/{audio_id}/synthesize",
            "status": "GET /audio/{audio_id}/status",
            "get_note_audio": "GET /audio/note/{note_id}",
            "get_audio": "GET /audio/{audio_id}",
            "delete_audio": "DELETE /audio/{audio_id}"
        }
    } 