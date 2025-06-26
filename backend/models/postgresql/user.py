from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from core.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    picture = Column(String)  # Google profile picture URL
    google_id = Column(String, unique=True, index=True)  # Google OAuth ID
    supabase_id = Column(String, unique=True, nullable=True, index=True)  # Supabase Auth ID
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"
    
    def to_dict(self):
        """Convert user object to dictionary"""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "picture": self.picture,
            "google_id": self.google_id,
            "supabase_id": self.supabase_id,
            "is_active": self.is_active,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_or_create_user(cls, email, name, picture=None, google_id=None, supabase_id=None, db=None):
        """Get existing user or create new one with Google OAuth data"""
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
            if google_id and user.google_id != google_id:
                user.google_id = google_id
            if supabase_id and user.supabase_id != supabase_id:
                user.supabase_id = supabase_id
            
            db.commit()
            db.refresh(user)
            return user, False  # False indicates user already existed
        
        # Create new user
        user = cls(
            email=email,
            name=name,
            picture=picture,
            google_id=google_id,
            supabase_id=supabase_id,
            is_active=True
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, True  # True indicates new user was created