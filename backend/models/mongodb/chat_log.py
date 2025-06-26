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

class ChatMessage(BaseModel):
    """Individual chat message model"""
    message_id: str = Field(default_factory=lambda: str(ObjectId()))
    user_id: str
    user_name: str
    user_picture: Optional[str] = None
    content: str
    message_type: str = "text"  # text, ai, file, system
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_ai: bool = False
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: lambda v: str(v)
        }

class GroupChatLog(BaseModel):
    """Group chat log for room topics"""
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    room_id: str
    topic_id: str
    messages: List[ChatMessage] = []
    is_active: bool = True
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: lambda v: str(v)
        }
        allow_population_by_field_name = True

class NoteChatLog(BaseModel):
    """Chat log for AI conversations in notes"""
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    note_id: str
    user_id: str
    messages: List[ChatMessage] = []
    document_context: Optional[str] = None  # Summary or context from uploaded document
    is_active: bool = True
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: lambda v: str(v)
        }
        allow_population_by_field_name = True

class AIResponse(BaseModel):
    """AI-generated response model"""
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    request_id: str
    user_id: str
    note_id: Optional[str] = None
    topic_id: Optional[str] = None
    room_id: Optional[str] = None
    request_type: str  # summary, quiz, audio, chat
    prompt: str
    response: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: lambda v: str(v)
        }
        allow_population_by_field_name = True

class QuizQuestion(BaseModel):
    """Quiz question model"""
    question: str
    options: List[str]
    correct_answer: int  # Index of correct option
    explanation: str
    difficulty: str = "medium"

class QuizResponse(BaseModel):
    """Quiz response model"""
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    note_id: str
    user_id: str
    questions: List[QuizQuestion] = []
    total_questions: int
    difficulty: str = "medium"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: lambda v: str(v)
        }
        allow_population_by_field_name = True

class AudioResponse(BaseModel):
    """Audio overview response model"""
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    note_id: str
    user_id: str
    host_script: str
    expert_script: str
    audio_url: Optional[str] = None
    status: str = "generated"  # generated, processing, completed, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: lambda v: str(v)
        }
        allow_population_by_field_name = True

class ChatLogBase(BaseModel):
    room_id: str = Field(...)
    topic_id: Optional[str] = Field(None, description="The ID of the topic within the room")
    messages: List[ChatMessage] = Field(default_factory=list)
    is_active: bool = Field(default=True)
    last_activity: datetime = Field(default_factory=datetime.utcnow)

class ChatLogCreate(ChatLogBase):
    pass

class ChatLogUpdate(BaseModel):
    messages: Optional[List[ChatMessage]] = Field(None)
    is_active: Optional[bool] = Field(None)
    last_activity: Optional[datetime] = Field(None)

class ChatLog(ChatLogBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "room_id": "room123",
                "topic_id": "topic456",
                "messages": [
                    {
                        "message_id": "msg1",
                        "user_id": "user123",
                        "user_name": "John Doe",
                        "content": "Hello everyone!",
                        "message_type": "text",
                        "timestamp": "2023-12-01T10:00:00Z",
                        "is_ai": False
                    }
                ],
                "is_active": True,
                "last_activity": "2023-12-01T10:00:00Z"
            }
        }
    
    def to_dict(self):
        """Convert chat log to dictionary for MongoDB"""
        return {
            "_id": str(self.id),
            "room_id": self.room_id,
            "topic_id": self.topic_id,
            "messages": [msg.dict() for msg in self.messages],
            "is_active": self.is_active,
            "last_activity": self.last_activity,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    def add_message(self, message: ChatMessage):
        """Add a message to the chat log"""
        self.messages.append(message)
        self.last_activity = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def get_recent_messages(self, limit: int = 50) -> List[ChatMessage]:
        """Get recent messages from the chat log"""
        return self.messages[-limit:] if self.messages else [] 