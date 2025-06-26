from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base
import uuid

class ChatLog(Base):
    __tablename__ = "chat_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    note_id = Column(String, ForeignKey("notes.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="chat_logs")
    note = relationship("Note", back_populates="chat_logs")
    
    def __repr__(self):
        return f"<ChatLog(id={self.id}, user_id={self.user_id}, note_id={self.note_id})>"
    
    def to_dict(self):
        """Convert chat log to dictionary for API responses"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "note_id": self.note_id,
            "question": self.question,
            "answer": self.answer,
            "created_at": self.created_at.isoformat() if self.created_at else None
        } 