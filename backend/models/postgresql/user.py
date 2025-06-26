from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)  # For email/password auth
    picture = Column(Text, nullable=True)  # Profile picture URL (optional)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    created_rooms = relationship("Room", back_populates="creator", foreign_keys="Room.created_by_user_id")
    notes = relationship("Note", back_populates="user")
    room_participants = relationship("RoomParticipant", back_populates="user")
    created_topics = relationship("Topic", back_populates="creator", foreign_keys="Topic.created_by_user_id")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"
    
    def to_dict(self):
        """Convert user to dictionary for API responses"""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "picture": self.picture,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_or_create_user(cls, email, name, picture=None, db=None):
        """Get existing user or create new one by email"""
        if not db:
            raise ValueError("Database session required")
        
        # Try to find existing user by email
        user = db.query(cls).filter(cls.email == email).first()
        
        if user:
            # Update user data if new information is provided
            if name and user.name != name:
                user.name = name
            if picture and user.picture != picture:
                user.picture = picture
            db.commit()
            db.refresh(user)
            return user, False  # False indicates user already existed
        
        # Create new user
        user = cls(
            email=email,
            name=name,
            picture=picture,
            is_active=True
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, True  # True indicates new user was created