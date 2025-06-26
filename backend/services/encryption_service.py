import os
from cryptography.fernet import Fernet, InvalidToken
from core.config import settings

class EncryptionService:
    """Encrypts and decrypts messages using Fernet symmetric encryption."""
    def __init__(self):
        self._warned = False
        key = getattr(settings, 'ENCRYPTION_KEY', None) or os.environ.get('ENCRYPTION_KEY')
        if not key:
            # For demo/dev only: generate a key if not set
            key = Fernet.generate_key()
            print(f"[EncryptionService] WARNING: No ENCRYPTION_KEY set. Generated key: {key.decode()}")
            self._warned = True
        if isinstance(key, str):
            key = key.encode()
        self.fernet = Fernet(key)

    def encrypt_message(self, message, *args, **kwargs):
        """Encrypt a message (str or bytes). Returns base64 string or error string."""
        try:
            if isinstance(message, str):
                message = message.encode()
            encrypted = self.fernet.encrypt(message)
            return encrypted.decode()
        except Exception as e:
            if not self._warned:
                print(f"Encryption error: {e}")
                self._warned = True
            return "[Encryption failed]"

    def decrypt_message(self, message, *args, **kwargs):
        """Decrypt a message (base64 str or bytes). Returns string or error string."""
        try:
            if isinstance(message, str):
                message = message.encode()
            decrypted = self.fernet.decrypt(message)
            return decrypted.decode()
        except InvalidToken:
            return "[Decryption failed: Invalid token]"
        except Exception as e:
            if not self._warned:
                print(f"Decryption error: {e}")
                self._warned = True
            return "[Decryption failed]"

encryption_service = EncryptionService() 