from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def quiz_root():
    return {"message": "Quiz API"} 