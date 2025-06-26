from pydantic import BaseModel, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from typing import Optional, List, Any
from datetime import datetime
from bson import ObjectId


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
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "_id": "60d5ec49e9c9e6b3b8e4b1a2",
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