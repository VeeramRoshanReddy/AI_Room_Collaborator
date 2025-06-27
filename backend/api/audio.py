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
from services.elevenlabs_service import elevenlabs_service
from pydub import AudioSegment
import tempfile
import boto3
from botocore.exceptions import NoCredentialsError

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
    """Synthesize audio from generated script using ElevenLabs and stitch as podcast"""
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
        
        try:
            # Get voice IDs from env
            host_voice_id = os.getenv("ELEVENLABS_HOST_VOICE_ID")
            expert_voice_id = os.getenv("ELEVENLABS_EXPERT_VOICE_ID")
            if not host_voice_id or not expert_voice_id:
                raise Exception("Voice IDs for host and expert must be set in environment.")
            
            # Synthesize host and expert lines
            host_audio = elevenlabs_service.synthesize(audio["host_script"], host_voice_id)
            expert_audio = elevenlabs_service.synthesize(audio["expert_script"], expert_voice_id)
            
            # Save to temp files
            with tempfile.NamedTemporaryFile(delete=False, suffix="_host.mp3") as host_file:
                host_file.write(host_audio)
                host_path = host_file.name
            with tempfile.NamedTemporaryFile(delete=False, suffix="_expert.mp3") as expert_file:
                expert_file.write(expert_audio)
                expert_path = expert_file.name
            
            # Stitch audio
            host_segment = AudioSegment.from_file(host_path, format="mp3")
            expert_segment = AudioSegment.from_file(expert_path, format="mp3")
            podcast_audio = host_segment + expert_segment
            
            # Save final podcast locally first
            static_audio_dir = os.path.join(os.getcwd(), "static", "audio")
            os.makedirs(static_audio_dir, exist_ok=True)
            podcast_path = os.path.join(static_audio_dir, f"podcast_{audio_id}.mp3")
            podcast_audio.export(podcast_path, format="mp3")

            # Upload to AWS S3
            aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
            aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
            aws_bucket = os.getenv("AWS_S3_BUCKET")
            aws_region = os.getenv("AWS_REGION", "us-east-1")
            s3_client = boto3.client(
                's3',
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key,
                region_name=aws_region
            )
            s3_key = f"audio/podcast_{audio_id}.mp3"
            try:
                s3_client.upload_file(podcast_path, aws_bucket, s3_key, ExtraArgs={'ACL': 'public-read', 'ContentType': 'audio/mpeg'})
                audio_url = f"https://{aws_bucket}.s3.{aws_region}.amazonaws.com/{s3_key}"
            except NoCredentialsError:
                raise Exception("AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.")
            except Exception as e:
                raise Exception(f"Failed to upload audio to S3: {e}")
            
            await mongo_db.audio_responses.update_one(
                {"_id": audio_id},
                {"$set": {"status": "completed", "audio_url": audio_url}}
            )
            
            return {
                "message": "Audio synthesis completed",
                "audio_id": audio_id,
                "status": "completed",
                "audio_url": audio_url
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