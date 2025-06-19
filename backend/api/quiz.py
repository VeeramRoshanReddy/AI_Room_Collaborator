from fastapi import APIRouter
from backend.core.config import settings

router = APIRouter()

@router.get("/")
async def quiz_root():
    return {"message": "Quiz API"} 