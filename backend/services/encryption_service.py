import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Optional
import logging
from core.config import settings
from sqlalchemy.orm import Session
from models.postgresql.topic import Topic

logger = logging.getLogger(__name__)

class EncryptionService:
    def __init__(self):
        self.encryption_key = self._get_encryption_key()
        self.cipher_suite = Fernet(self.encryption_key)
    
    def _get_encryption_key(self) -> bytes:
        """Get or generate encryption key"""
        if not settings.ENCRYPTION_KEY:
            # Generate a new key if not provided
            key = Fernet.generate_key()
            logger.warning("No encryption key provided. Generated new key. Please set ENCRYPTION_KEY in environment.")
            return key
        
        try:
            # Use the provided key
            return base64.urlsafe_b64decode(settings.ENCRYPTION_KEY)
        except Exception as e:
            logger.error(f"Invalid encryption key format: {e}")
            # Generate a new key as fallback
            key = Fernet.generate_key()
            logger.warning("Invalid encryption key. Generated new key. Please set valid ENCRYPTION_KEY in environment.")
            return key
    
    def encrypt_message(self, message: str) -> str:
        """Encrypt a message"""
        try:
            if not settings.CHAT_ENCRYPTION_ENABLED:
                return message
            
            # Convert string to bytes and encrypt
            message_bytes = message.encode('utf-8')
            encrypted_bytes = self.cipher_suite.encrypt(message_bytes)
            
            # Return base64 encoded string
            return base64.urlsafe_b64encode(encrypted_bytes).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error encrypting message: {e}")
            # Return original message if encryption fails
            return message
    
    def decrypt_message(self, encrypted_message: str) -> str:
        """Decrypt a message"""
        try:
            if not settings.CHAT_ENCRYPTION_ENABLED:
                return encrypted_message
            
            # Decode base64 and decrypt
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_message.encode('utf-8'))
            decrypted_bytes = self.cipher_suite.decrypt(encrypted_bytes)
            
            # Convert back to string
            return decrypted_bytes.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error decrypting message: {e}")
            # Return encrypted message if decryption fails
            return encrypted_message
    
    def generate_room_key(self, room_id: str) -> str:
        """Generate a unique encryption key for a room"""
        try:
            # Create a key based on room ID and master key
            salt = room_id.encode('utf-8')
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(self.encryption_key))
            return key.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error generating room key: {e}")
            # Fallback to master key
            return base64.urlsafe_b64encode(self.encryption_key).decode('utf-8')
    
    def encrypt_file(self, file_data: bytes) -> bytes:
        """Encrypt file data"""
        try:
            if not settings.CHAT_ENCRYPTION_ENABLED:
                return file_data
            
            return self.cipher_suite.encrypt(file_data)
            
        except Exception as e:
            logger.error(f"Error encrypting file: {e}")
            return file_data
    
    def decrypt_file(self, encrypted_file_data: bytes) -> bytes:
        """Decrypt file data"""
        try:
            if not settings.CHAT_ENCRYPTION_ENABLED:
                return encrypted_file_data
            
            return self.cipher_suite.decrypt(encrypted_file_data)
            
        except Exception as e:
            logger.error(f"Error decrypting file: {e}")
            return encrypted_file_data
    
    def hash_password(self, password: str) -> str:
        """Hash a password for storage"""
        try:
            salt = os.urandom(16)
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(password.encode('utf-8')))
            salt_b64 = base64.urlsafe_b64encode(salt).decode('utf-8')
            return f"{salt_b64}:{key.decode('utf-8')}"
            
        except Exception as e:
            logger.error(f"Error hashing password: {e}")
            return password
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        try:
            if ':' not in hashed_password:
                return False
            
            salt_b64, key_b64 = hashed_password.split(':', 1)
            salt = base64.urlsafe_b64decode(salt_b64)
            stored_key = base64.urlsafe_b64decode(key_b64)
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = kdf.derive(password.encode('utf-8'))
            
            return key == stored_key
            
        except Exception as e:
            logger.error(f"Error verifying password: {e}")
            return False

def get_topic_encryption_key(db: Session, topic_id: str) -> str:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise ValueError("Topic not found")
    return topic.encryption_key

# Global encryption service instance
encryption_service = EncryptionService() 