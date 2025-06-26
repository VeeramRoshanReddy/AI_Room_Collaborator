from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base
import uuid
import secrets

class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    room_id = Column(String, ForeignKey("rooms.id"), nullable=False)
    created_by_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    encryption_key = Column(String(255), nullable=False)  # For end-to-end encryption
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    room = relationship("Room", back_populates="topics")
    creator = relationship("User", back_populates="created_topics", foreign_keys=[created_by_user_id])
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.encryption_key:
            self.encryption_key = self._generate_encryption_key()
    
    def _generate_encryption_key(self) -> str:
        """Generate a unique encryption key for this topic"""
        return secrets.token_urlsafe(32)
    
    def __repr__(self):
        return f"<Topic(id={self.id}, title={self.title}, room_id={self.room_id})>"
    
    def to_dict(self):
        """Convert topic to dictionary for API responses"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "room_id": self.room_id,
            "created_by_user_id": self.created_by_user_id,
            "creator_name": self.creator.name if self.creator else None,
            "creator_picture": self.creator.picture if self.creator else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def to_dict_with_encryption_key(self):
        """Convert topic to dictionary including encryption key (for authorized users only)"""
        data = self.to_dict()
        data["encryption_key"] = self.encryption_key
        return data 