from fastapi import APIRouter
from core.config import settings

router = APIRouter()

@router.get("/")
async def user_root():
    return {"message": "User API"} 