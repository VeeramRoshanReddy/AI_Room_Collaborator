from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def topic_root():
    return {"message": "Topic API"} 