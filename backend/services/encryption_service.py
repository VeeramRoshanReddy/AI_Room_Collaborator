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
        if settings.ENCRYPTION_KEY:
            try:
                # First, try to use it as a direct Fernet key
                test_key = settings.ENCRYPTION_KEY.encode() if isinstance(settings.ENCRYPTION_KEY, str) else settings.ENCRYPTION_KEY
                Fernet(test_key)  # Test if it's valid
                return test_key
            except Exception:
                # If not valid, derive a proper key from the provided string
                logger.info("Converting provided ENCRYPTION_KEY to proper Fernet format")
                return self._derive_key_from_string(settings.ENCRYPTION_KEY)
        else:
            # Generate a new key (for development)
            key = Fernet.generate_key()
            logger.warning("Using generated encryption key. Set ENCRYPTION_KEY in environment for production.")
            logger.warning(f"Generated key: {key.decode()}")
            return key
    
    def encrypt_message(self, message: str, room_id: str) -> str:
        """Encrypt a message for a specific room"""
        try:
            if not settings.CHAT_ENCRYPTION_ENABLED:
                return message
            
            # Add room context to prevent cross-room decryption
            message_with_context = f"{room_id}:{message}"
            encrypted_data = self.cipher_suite.encrypt(message_with_context.encode())
            return base64.urlsafe_b64encode(encrypted_data).decode()
        
        except Exception as e:
            logger.error(f"Error encrypting message: {e}")
            return message
    
    def decrypt_message(self, encrypted_message: str, room_id: str) -> Optional[str]:
        """Decrypt a message for a specific room"""
        try:
            if not settings.CHAT_ENCRYPTION_ENABLED:
                return encrypted_message
            
            # Decode from base64
            encrypted_data = base64.urlsafe_b64decode(encrypted_message.encode())
            decrypted_data = self.cipher_suite.decrypt(encrypted_data)
            decrypted_message = decrypted_data.decode()
            
            # Verify room context
            if decrypted_message.startswith(f"{room_id}:"):
                return decrypted_message[len(f"{room_id}:"):]
            else:
                logger.warning("Message room context mismatch")
                return None
        
        except Exception as e:
            logger.error(f"Error decrypting message: {e}")
            return None
    
    def generate_room_key(self, room_id: str, user_ids: list) -> str:
        """Generate a unique encryption key for a room"""
        try:
            # Create a deterministic key based on room and users
            room_data = f"{room_id}:{':'.join(sorted(user_ids))}"
            salt = room_data.encode()
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(self.encryption_key))
            return key.decode()
        
        except Exception as e:
            logger.error(f"Error generating room key: {e}")
            return None
    
    def encrypt_file_content(self, content: bytes, file_id: str) -> bytes:
        """Encrypt file content"""
        try:
            if not settings.CHAT_ENCRYPTION_ENABLED:
                return content
            
            # Add file context
            content_with_context = f"{file_id}:".encode() + content
            return self.cipher_suite.encrypt(content_with_context)
        
        except Exception as e:
            logger.error(f"Error encrypting file content: {e}")
            return content
    
    def decrypt_file_content(self, encrypted_content: bytes, file_id: str) -> Optional[bytes]:
        """Decrypt file content"""
        try:
            if not settings.CHAT_ENCRYPTION_ENABLED:
                return encrypted_content
            
            decrypted_data = self.cipher_suite.decrypt(encrypted_content)
            
            # Verify file context
            if decrypted_data.startswith(f"{file_id}:".encode()):
                return decrypted_data[len(f"{file_id}:".encode()):]
            else:
                logger.warning("File context mismatch")
                return None
        
        except Exception as e:
            logger.error(f"Error decrypting file content: {e}")
            return None

def get_topic_encryption_key(db: Session, topic_id: str) -> str:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise ValueError("Topic not found")
    return topic.encryption_key

# Global encryption service instance
encryption_service = EncryptionService() 