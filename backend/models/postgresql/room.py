from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Table, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base
import uuid
import random
import secrets
import string

def generate_uuid():
    return str(uuid.uuid4())

def generate_room_id():
    """Generate a random 8-digit room ID"""
    return str(random.randint(10000000, 99999999))

def generate_room_password():
    """Generate a random 8-digit room password"""
    return str(random.randint(10000000, 99999999))

# Association table for room members
room_members = Table(
    'room_members',
    Base.metadata,
    Column('room_id', String, ForeignKey('rooms.id'), primary_key=True),
    Column('user_id', String, ForeignKey('users.id'), primary_key=True),
    Column('joined_at', DateTime(timezone=True), server_default=func.now())
)

# Association table for room admins
room_admins = Table(
    'room_admins',
    Base.metadata,
    Column('room_id', String, ForeignKey('rooms.id'), primary_key=True),
    Column('user_id', String, ForeignKey('users.id'), primary_key=True),
    Column('assigned_at', DateTime(timezone=True), server_default=func.now())
)

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    room_id = Column(String(8), unique=True, nullable=False, index=True)  # 8-digit room ID
    password = Column(String(8), nullable=False)  # 8-digit room password
    created_by_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="created_rooms", foreign_keys=[created_by_user_id])
    participants = relationship("RoomParticipant", back_populates="room", cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="room", cascade="all, delete-orphan")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.room_id:
            self.room_id = self._generate_room_id()
        if not self.password:
            self.password = self._generate_password()
    
    def _generate_room_id(self) -> str:
        """Generate a unique 8-digit room ID"""
        while True:
            room_id = ''.join(secrets.choice(string.digits) for _ in range(8))
            # Check if room_id already exists (this would be done in the service layer)
            return room_id
    
    def _generate_password(self) -> str:
        """Generate a random 8-digit password"""
        return ''.join(secrets.choice(string.digits) for _ in range(8))
    
    def __repr__(self):
        return f"<Room(id={self.id}, room_id={self.room_id}, title={self.title})>"
    
    def to_dict(self):
        """Convert room to dictionary for API responses"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "room_id": self.room_id,
            "password": self.password,
            "created_by_user_id": self.created_by_user_id,
            "creator_name": self.creator.name if self.creator else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "participant_count": len(self.participants) if self.participants else 0,
            "topic_count": len(self.topics) if self.topics else 0
        }
    
    def to_dict_without_password(self):
        """Convert room to dictionary without exposing password"""
        data = self.to_dict()
        data.pop("password", None)
        return data

class RoomParticipant(Base):
    __tablename__ = "room_participants"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    is_admin = Column(Boolean, default=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    room = relationship("Room", back_populates="participants")
    user = relationship("User", back_populates="room_participants")
    
    def __repr__(self):
        return f"<RoomParticipant(room_id={self.room_id}, user_id={self.user_id}, is_admin={self.is_admin})>"
    
    def to_dict(self):
        """Convert participant to dictionary for API responses"""
        return {
            "id": self.id,
            "room_id": self.room_id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "user_email": self.user.email if self.user else None,
            "user_picture": self.user.picture if self.user else None,
            "is_admin": self.is_admin,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None
        }

    @classmethod
    def create_room(cls, name, description, created_by, db):
        """Create a new room with unique room_id and room_password"""
        max_attempts = 10
        for attempt in range(max_attempts):
            room_id = generate_room_id()
            room_password = generate_room_password()
            
            # Check if room_id already exists
            existing_room = db.query(cls).filter(cls.room_id == room_id).first()
            if not existing_room:
                room = cls(
                    room_id=room_id,
                    password=room_password,
                    title=name,
                    description=description,
                    created_by_user_id=created_by
                )
                return room
        
        raise ValueError("Could not generate unique room ID after multiple attempts") 