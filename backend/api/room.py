from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def room_root():
    return {"message": "Room API"} 