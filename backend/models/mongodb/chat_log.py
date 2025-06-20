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
    message_id: str = Field(...)
    user_id: str = Field(...)
    user_name: str = Field(...)
    user_picture: Optional[str] = Field(None)
    content: str = Field(...)
    message_type: str = Field(default="text")  # text, system, ai
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_ai: bool = Field(default=False)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ChatLogBase(BaseModel):
    room_id: str = Field(...)
    topic_id: Optional[str] = Field(None)
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
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
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