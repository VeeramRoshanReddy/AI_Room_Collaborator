from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from pydantic import BaseModel
from core.database import get_db, get_mongo_db
from middleware.auth_middleware import get_current_user
from models.postgresql.note import Note
from models.mongodb.ai_response import QuizResponse, QuizQuestion
from services.ai_service import ai_service
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/quiz", tags=["Quiz"])

# Pydantic models
class QuizGenerateRequest(BaseModel):
    note_id: str
    difficulty: Optional[str] = "medium"
    num_questions: Optional[int] = 10

class QuizResponse(BaseModel):
    id: str
    note_id: str
    user_id: str
    questions: List[dict]
    total_questions: int
    difficulty: str
    created_at: str

class QuizSubmission(BaseModel):
    quiz_id: str
    answers: List[int]  # List of selected answer indices
    time_taken: Optional[int] = None  # Time taken in seconds

class QuizResult(BaseModel):
    quiz_id: str
    score: int
    total_questions: int
    percentage: float
    correct_answers: List[int]
    time_taken: Optional[int] = None
    completed_at: str

@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(
    request: QuizGenerateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a quiz from a note's content"""
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
                detail="Note must have an uploaded file to generate quiz"
            )
        
        # Get document content for quiz generation
        document_content = note.content or ""
        if not document_content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Note must have content to generate quiz"
            )
        
        # Generate quiz questions using AI service
        questions = await ai_service.generate_quiz_questions(
            document_content=document_content,
            num_questions=request.num_questions,
            difficulty=request.difficulty
        )
        
        if not questions:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate quiz questions"
            )
        
        # Store quiz in MongoDB
        mongo_db = get_mongo_db()
        quiz_data = QuizResponse(
            note_id=request.note_id,
            user_id=current_user["id"],
            questions=questions,
            total_questions=len(questions),
            difficulty=request.difficulty
        )
        
        result = await mongo_db.quiz_responses.insert_one(quiz_data.dict())
        quiz_data.id = str(result.inserted_id)
        
        # Update note to mark quiz as generated
        note.quiz_generated = True
        db.commit()
        
        return QuizResponse(
            id=quiz_data.id,
            note_id=quiz_data.note_id,
            user_id=quiz_data.user_id,
            questions=quiz_data.questions,
            total_questions=quiz_data.total_questions,
            difficulty=quiz_data.difficulty,
            created_at=quiz_data.created_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate quiz"
        )

@router.get("/note/{note_id}", response_model=List[QuizResponse])
async def get_note_quizzes(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all quizzes for a specific note"""
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
        
        # Get quizzes from MongoDB
        mongo_db = get_mongo_db()
        quizzes = await mongo_db.quiz_responses.find({
            "note_id": note_id,
            "user_id": current_user["id"]
        }).sort("created_at", -1).to_list(length=50)
        
        return [
            QuizResponse(
                id=str(quiz["_id"]),
                note_id=quiz["note_id"],
                user_id=quiz["user_id"],
                questions=quiz["questions"],
                total_questions=quiz["total_questions"],
                difficulty=quiz["difficulty"],
                created_at=quiz["created_at"].isoformat()
            )
            for quiz in quizzes
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting note quizzes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get quizzes"
        )

@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: str,
    current_user: dict = Depends(get_current_user),
    mongo_db = Depends(get_mongo_db)
):
    """Get a specific quiz by ID"""
    try:
        quiz = await mongo_db.quiz_responses.find_one({
            "_id": quiz_id,
            "user_id": current_user["id"]
        })
        
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found or access denied"
            )
        
        return QuizResponse(
            id=str(quiz["_id"]),
            note_id=quiz["note_id"],
            user_id=quiz["user_id"],
            questions=quiz["questions"],
            total_questions=quiz["total_questions"],
            difficulty=quiz["difficulty"],
            created_at=quiz["created_at"].isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quiz: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get quiz"
        )

@router.post("/{quiz_id}/submit", response_model=QuizResult)
async def submit_quiz(
    quiz_id: str,
    submission: QuizSubmission,
    current_user: dict = Depends(get_current_user),
    mongo_db = Depends(get_mongo_db)
):
    """Submit quiz answers and get results"""
    try:
        # Get quiz
        quiz = await mongo_db.quiz_responses.find_one({
            "_id": quiz_id,
            "user_id": current_user["id"]
        })
        
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found or access denied"
            )
        
        # Validate submission
        if len(submission.answers) != len(quiz["questions"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Number of answers must match number of questions"
            )
        
        # Calculate score
        correct_answers = []
        score = 0
        
        for i, (question, answer) in enumerate(zip(quiz["questions"], submission.answers)):
            if answer == question["correct_answer"]:
                score += 1
                correct_answers.append(i)
        
        percentage = (score / len(quiz["questions"])) * 100
        
        # Create result
        result = QuizResult(
            quiz_id=quiz_id,
            score=score,
            total_questions=len(quiz["questions"]),
            percentage=percentage,
            correct_answers=correct_answers,
            time_taken=submission.time_taken,
            completed_at=datetime.utcnow().isoformat()
        )
        
        # Store result in MongoDB
        await mongo_db.quiz_results.insert_one(result.dict())
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting quiz: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit quiz"
        )

@router.delete("/{quiz_id}")
async def delete_quiz(
    quiz_id: str,
    current_user: dict = Depends(get_current_user),
    mongo_db = Depends(get_mongo_db)
):
    """Delete a quiz"""
    try:
        result = await mongo_db.quiz_responses.delete_one({
            "_id": quiz_id,
            "user_id": current_user["id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found or access denied"
            )
        
        return {"message": "Quiz deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting quiz: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete quiz"
        )

@router.get("/")
async def quiz_root():
    """Quiz API root endpoint"""
    return {
        "message": "Quiz API v1.0",
        "endpoints": {
            "generate": "POST /quiz/generate",
            "get_note_quizzes": "GET /quiz/note/{note_id}",
            "get_quiz": "GET /quiz/{quiz_id}",
            "submit_quiz": "POST /quiz/{quiz_id}/submit",
            "delete_quiz": "DELETE /quiz/{quiz_id}"
        }
    } 