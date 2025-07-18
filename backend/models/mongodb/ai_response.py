from pydantic import BaseModel, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from typing import Any

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetJsonSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.no_info_wrap_validator_function(
            cls.validate,
            core_schema.str_schema(),
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return cls(v)

    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {"type": "string", "format": "objectid"}
    
    def __str__(self) -> str:
        return str(super())
    
    def __repr__(self) -> str:
        return f"PyObjectId('{str(self)}')"

class AIResponseBase(BaseModel):
    user_id: str = Field(...)
    request_type: str = Field(...)  # chat, quiz, audio, summary
    prompt: str = Field(...)
    response: str = Field(...)
    room_id: Optional[str] = Field(None)
    topic_id: Optional[str] = Field(None)
    document_id: Optional[str] = Field(None)
    model_used: str = Field(default="gpt-4")
    tokens_used: Optional[int] = Field(None)
    processing_time: Optional[float] = Field(None)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class AIResponseCreate(AIResponseBase):
    pass

class AIResponseUpdate(BaseModel):
    response: Optional[str] = Field(None)
    tokens_used: Optional[int] = Field(None)
    processing_time: Optional[float] = Field(None)
    metadata: Optional[Dict[str, Any]] = Field(None)

class AIResponse(AIResponseBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "request_type": "chat",
                "prompt": "What is machine learning?",
                "response": "Machine learning is a subset of artificial intelligence...",
                "room_id": "room456",
                "topic_id": "topic789",
                "document_id": "doc123",
                "model_used": "gpt-4",
                "tokens_used": 150,
                "processing_time": 2.5,
                "metadata": {
                    "temperature": 0.7,
                    "max_tokens": 500
                }
            }
        }
    
    def to_dict(self):
        """Convert AI response to dictionary for MongoDB"""
        return {
            "_id": str(self.id),
            "user_id": self.user_id,
            "request_type": self.request_type,
            "prompt": self.prompt,
            "response": self.response,
            "room_id": self.room_id,
            "topic_id": self.topic_id,
            "document_id": self.document_id,
            "model_used": self.model_used,
            "tokens_used": self.tokens_used,
            "processing_time": self.processing_time,
            "metadata": self.metadata,
            "created_at": self.created_at
        }

class QuizQuestion(BaseModel):
    question: str = Field(...)
    options: List[str] = Field(...)
    correct_answer: int = Field(...)  # Index of correct option
    explanation: Optional[str] = Field(None)
    difficulty: str = Field(default="medium")  # easy, medium, hard

class QuizResponse(AIResponseBase):
    questions: List[QuizQuestion] = Field(default_factory=list)
    total_questions: int = Field(default=0)
    difficulty: str = Field(default="medium")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AudioResponse(AIResponseBase):
    audio_url: Optional[str] = Field(None)
    audio_duration: Optional[float] = Field(None)
    voice_id: Optional[str] = Field(None)
    audio_format: str = Field(default="mp3")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str} 