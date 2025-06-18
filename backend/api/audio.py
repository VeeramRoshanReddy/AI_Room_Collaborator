from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def audio_root():
    return {"message": "Audio API"} 