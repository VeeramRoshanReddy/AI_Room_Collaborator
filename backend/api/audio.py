from fastapi import APIRouter
from core.config import settings

router = APIRouter()

@router.get("/")
async def audio_root():
    return {"message": "Audio API"} 