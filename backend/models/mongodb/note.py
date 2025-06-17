from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    user_id: str = Field(...)
    room_id: Optional[str] = Field(None)
    topic_id: Optional[str] = Field(None)
    tags: List[str] = Field(default_factory=list)
    is_public: bool = Field(default=False)
    is_archived: bool = Field(default=False)

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[List[str]] = Field(None)
    is_public: Optional[bool] = Field(None)
    is_archived: Optional[bool] = Field(None)

class Note(NoteBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "title": "Study Notes for AI Course",
                "content": "These are my notes from the AI course...",
                "user_id": "user123",
                "room_id": "room456",
                "topic_id": "topic789",
                "tags": ["AI", "Machine Learning", "Study"],
                "is_public": False,
                "is_archived": False
            }
        }
    
    def to_dict(self):
        """Convert note to dictionary for MongoDB"""
        return {
            "_id": str(self.id),
            "title": self.title,
            "content": self.content,
            "user_id": self.user_id,
            "room_id": self.room_id,
            "topic_id": self.topic_id,
            "tags": self.tags,
            "is_public": self.is_public,
            "is_archived": self.is_archived,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        } 