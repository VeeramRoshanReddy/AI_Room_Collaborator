from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class ChatLog(Base):
    __tablename__ = "chat_logs"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    note_id = Column(String, nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow) 