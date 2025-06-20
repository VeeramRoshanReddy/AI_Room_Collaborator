from fastapi import APIRouter
from core.config import settings

router = APIRouter()

@router.get("/")
async def quiz_root():
    return {"message": "Quiz API"} 