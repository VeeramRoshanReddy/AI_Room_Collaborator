from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

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
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text)
    is_public = Column(Boolean, default=True)
    max_members = Column(String, default="50")  # Store as string for flexibility
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    members = relationship("User", secondary=room_members, backref="joined_rooms")
    admins = relationship("User", secondary=room_admins, backref="admin_rooms")
    
    def __repr__(self):
        return f"<Room(id={self.id}, name={self.name}, created_by={self.created_by})>"
    
    def to_dict(self):
        """Convert room object to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "is_public": self.is_public,
            "max_members": self.max_members,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "creator": self.creator.to_dict() if self.creator else None,
            "members": [member.to_dict() for member in self.members],
            "admins": [admin.to_dict() for admin in self.admins],
            "member_count": len(self.members),
            "admin_count": len(self.admins)
        } 