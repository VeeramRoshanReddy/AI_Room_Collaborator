from supabase import create_client, Client
from typing import Dict, Any, List, Optional
import logging
from backend.core.config import settings
import secrets

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        self.client: Optional[Client] = None
        self._initialize_supabase()
    
    def _initialize_supabase(self):
        """Initialize Supabase client"""
        try:
            self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            self.client = None
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email from Supabase"""
        if not self.client:
            return None
        
        try:
            response = self.client.table('users').select('*').eq('email', email).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    async def get_user_by_google_id(self, google_id: str) -> Optional[Dict[str, Any]]:
        """Get user by Google ID from Supabase"""
        if not self.client:
            return None
        
        try:
            response = self.client.table('users').select('*').eq('google_id', google_id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error getting user by Google ID: {e}")
            return None
    
    async def create_user(self, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new user in Supabase"""
        if not self.client:
            return None
        
        try:
            response = self.client.table('users').insert(user_data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None
    
    async def update_user(self, user_id: str, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user in Supabase"""
        if not self.client:
            return None
        
        try:
            response = self.client.table('users').update(user_data).eq('id', user_id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            return None
    
    async def get_rooms_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Get rooms where user is a member or admin"""
        if not self.client:
            return []
        
        try:
            # Get rooms where user is a member
            member_response = self.client.table('room_members').select(
                'room_id, rooms(*)'
            ).eq('user_id', user_id).execute()
            
            # Get rooms where user is an admin
            admin_response = self.client.table('room_admins').select(
                'room_id, rooms(*)'
            ).eq('user_id', user_id).execute()
            
            rooms = []
            
            # Process member rooms
            for item in member_response.data:
                if item.get('rooms'):
                    room = item['rooms']
                    room['user_role'] = 'member'
                    rooms.append(room)
            
            # Process admin rooms
            for item in admin_response.data:
                if item.get('rooms'):
                    room = item['rooms']
                    room['user_role'] = 'admin'
                    # Avoid duplicates if user is both member and admin
                    existing_room = next((r for r in rooms if r['id'] == room['id']), None)
                    if existing_room:
                        existing_room['user_role'] = 'admin'
                    else:
                        rooms.append(room)
            
            return rooms
            
        except Exception as e:
            logger.error(f"Error getting rooms by user: {e}")
            return []
    
    async def get_room_members(self, room_id: str) -> List[Dict[str, Any]]:
        """Get all members of a room"""
        if not self.client:
            return []
        
        try:
            # Get members
            member_response = self.client.table('room_members').select(
                'user_id, users(*)'
            ).eq('room_id', room_id).execute()
            
            # Get admins
            admin_response = self.client.table('room_admins').select(
                'user_id, users(*)'
            ).eq('room_id', room_id).execute()
            
            members = []
            
            # Process members
            for item in member_response.data:
                if item.get('users'):
                    user = item['users']
                    user['role'] = 'member'
                    members.append(user)
            
            # Process admins
            for item in admin_response.data:
                if item.get('users'):
                    user = item['users']
                    user['role'] = 'admin'
                    # Update existing member to admin if they exist
                    existing_member = next((m for m in members if m['id'] == user['id']), None)
                    if existing_member:
                        existing_member['role'] = 'admin'
                    else:
                        members.append(user)
            
            return members
            
        except Exception as e:
            logger.error(f"Error getting room members: {e}")
            return []
    
    async def add_room_member(self, room_id: str, user_id: str) -> bool:
        """Add a user as a member to a room"""
        if not self.client:
            return False
        
        try:
            self.client.table('room_members').insert({
                'room_id': room_id,
                'user_id': user_id
            }).execute()
            return True
        except Exception as e:
            logger.error(f"Error adding room member: {e}")
            return False
    
    async def add_room_admin(self, room_id: str, user_id: str) -> bool:
        """Add a user as an admin to a room"""
        if not self.client:
            return False
        
        try:
            self.client.table('room_admins').insert({
                'room_id': room_id,
                'user_id': user_id
            }).execute()
            return True
        except Exception as e:
            logger.error(f"Error adding room admin: {e}")
            return False
    
    async def remove_room_member(self, room_id: str, user_id: str) -> bool:
        """Remove a user from room members"""
        if not self.client:
            return False
        
        try:
            self.client.table('room_members').delete().eq('room_id', room_id).eq('user_id', user_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error removing room member: {e}")
            return False
    
    async def remove_room_admin(self, room_id: str, user_id: str) -> bool:
        """Remove a user from room admins"""
        if not self.client:
            return False
        
        try:
            self.client.table('room_admins').delete().eq('room_id', room_id).eq('user_id', user_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error removing room admin: {e}")
            return False
    
    async def get_topics_by_room(self, room_id: str) -> List[Dict[str, Any]]:
        """Get all topics in a room"""
        if not self.client:
            return []
        
        try:
            response = self.client.table('topics').select(
                '*, users(name, email, picture)'
            ).eq('room_id', room_id).eq('is_active', True).execute()
            
            return response.data or []
            
        except Exception as e:
            logger.error(f"Error getting topics by room: {e}")
            return []
    
    async def create_topic(self, topic_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new topic with a random encryption key"""
        if not self.client:
            return None
        try:
            # Generate a random encryption key for this topic
            topic_data['encryption_key'] = secrets.token_urlsafe(32)
            response = self.client.table('topics').insert(topic_data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error creating topic: {e}")
            return None
    
    async def update_topic(self, topic_id: str, topic_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a topic"""
        if not self.client:
            return None
        
        try:
            response = self.client.table('topics').update(topic_data).eq('id', topic_id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error updating topic: {e}")
            return None
    
    async def delete_topic(self, topic_id: str) -> bool:
        """Delete a topic (soft delete by setting is_active to False)"""
        if not self.client:
            return False
        
        try:
            self.client.table('topics').update({'is_active': False}).eq('id', topic_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting topic: {e}")
            return False

# Global Supabase service instance
supabase_service = SupabaseService() 