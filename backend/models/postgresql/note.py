from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base
import uuid

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # File upload fields
    uploaded_file_path = Column(String(500), nullable=True)
    uploaded_file_name = Column(String(255), nullable=True)
    uploaded_file_type = Column(String(50), nullable=True)  # pdf, doc, docx, etc.
    uploaded_file_size = Column(String(50), nullable=True)
    
    # AI-generated content
    document_summary = Column(Text, nullable=True)
    quiz_generated = Column(Boolean, default=False)
    audio_overview_generated = Column(Boolean, default=False)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notes")
    
    def __repr__(self):
        return f"<Note(id={self.id}, title={self.title}, user_id={self.user_id})>"
    
    def to_dict(self):
        """Convert note to dictionary for API responses"""
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "user_id": self.user_id,
            "uploaded_file_path": self.uploaded_file_path,
            "uploaded_file_name": self.uploaded_file_name,
            "uploaded_file_type": self.uploaded_file_type,
            "uploaded_file_size": self.uploaded_file_size,
            "document_summary": self.document_summary,
            "quiz_generated": self.quiz_generated,
            "audio_overview_generated": self.audio_overview_generated,
            "has_uploaded_file": bool(self.uploaded_file_path),
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def has_file_uploaded(self) -> bool:
        """Check if note has an uploaded file"""
        return bool(self.uploaded_file_path)
    
    def can_generate_quiz(self) -> bool:
        """Check if quiz can be generated (requires uploaded file)"""
        return self.has_file_uploaded()
    
    def can_generate_audio(self) -> bool:
        """Check if audio overview can be generated (requires uploaded file)"""
        return self.has_file_uploaded() 