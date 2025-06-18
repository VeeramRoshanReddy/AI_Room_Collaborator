from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text)
    room_id = Column(String, ForeignKey('rooms.id'), nullable=False)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    encryption_key = Column(String, nullable=False)
    
    # Relationships
    room = relationship("Room", backref="topics")
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<Topic(id={self.id}, title={self.title}, room_id={self.room_id})>"
    
    def to_dict(self):
        """Convert topic object to dictionary"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "room_id": self.room_id,
            "created_by": self.created_by,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "encryption_key": self.encryption_key,
            "creator": self.creator.to_dict() if self.creator else None,
            "room": {
                "id": self.room.id,
                "name": self.room.name
            } if self.room else None
        } 