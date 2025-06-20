import firebase_admin
from firebase_admin import credentials, storage, firestore
from typing import Optional, Dict, Any, List
import os
import logging
from core.config import settings
import aiofiles
import mimetypes
from datetime import datetime

logger = logging.getLogger(__name__)

class FirebaseService:
    def __init__(self):
        self.initialized = False
        self.bucket = None
        self.db = None
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            if not firebase_admin._apps:
                # Create credentials from environment variables
                cred = credentials.Certificate({
                    "type": "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
                    "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "client_id": settings.FIREBASE_CLIENT_ID,
                    "auth_uri": settings.FIREBASE_AUTH_URI,
                    "token_uri": settings.FIREBASE_TOKEN_URI,
                    "auth_provider_x509_cert_url": settings.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
                    "client_x509_cert_url": settings.FIREBASE_CLIENT_X509_CERT_URL
                })
                
                firebase_admin.initialize_app(cred, {
                    'storageBucket': f"{settings.FIREBASE_PROJECT_ID}.appspot.com"
                })
            
            self.bucket = storage.bucket()
            self.db = firestore.client()
            self.initialized = True
            logger.info("Firebase initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            self.initialized = False
    
    async def upload_file(self, file_path: str, destination_path: str, 
                         metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Upload a file to Firebase Storage"""
        if not self.initialized:
            raise Exception("Firebase not initialized")
        
        try:
            # Get file info
            file_size = os.path.getsize(file_path)
            file_name = os.path.basename(file_path)
            content_type, _ = mimetypes.guess_type(file_path)
            
            # Create blob
            blob = self.bucket.blob(destination_path)
            
            # Set metadata
            if metadata:
                blob.metadata = metadata
            
            if content_type:
                blob.content_type = content_type
            
            # Upload file
            blob.upload_from_filename(file_path)
            
            # Make blob publicly readable
            blob.make_public()
            
            # Get download URL
            download_url = blob.public_url
            
            # Store file info in Firestore
            file_info = {
                "file_name": file_name,
                "file_path": destination_path,
                "file_size": file_size,
                "content_type": content_type,
                "download_url": download_url,
                "uploaded_at": datetime.utcnow(),
                "metadata": metadata or {}
            }
            
            await self._store_file_info(file_info)
            
            return {
                "success": True,
                "download_url": download_url,
                "file_path": destination_path,
                "file_size": file_size,
                "content_type": content_type
            }
            
        except Exception as e:
            logger.error(f"Error uploading file to Firebase: {e}")
            raise
    
    async def upload_bytes(self, file_bytes: bytes, destination_path: str, 
                          content_type: str = None, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Upload bytes to Firebase Storage"""
        if not self.initialized:
            raise Exception("Firebase not initialized")
        
        try:
            # Create blob
            blob = self.bucket.blob(destination_path)
            
            # Set metadata
            if metadata:
                blob.metadata = metadata
            
            if content_type:
                blob.content_type = content_type
            
            # Upload bytes
            blob.upload_from_string(file_bytes, content_type=content_type)
            
            # Make blob publicly readable
            blob.make_public()
            
            # Get download URL
            download_url = blob.public_url
            
            # Store file info in Firestore
            file_info = {
                "file_name": os.path.basename(destination_path),
                "file_path": destination_path,
                "file_size": len(file_bytes),
                "content_type": content_type,
                "download_url": download_url,
                "uploaded_at": datetime.utcnow(),
                "metadata": metadata or {}
            }
            
            await self._store_file_info(file_info)
            
            return {
                "success": True,
                "download_url": download_url,
                "file_path": destination_path,
                "file_size": len(file_bytes),
                "content_type": content_type
            }
            
        except Exception as e:
            logger.error(f"Error uploading bytes to Firebase: {e}")
            raise
    
    async def download_file(self, file_path: str, local_path: str) -> bool:
        """Download a file from Firebase Storage"""
        if not self.initialized:
            raise Exception("Firebase not initialized")
        
        try:
            blob = self.bucket.blob(file_path)
            blob.download_to_filename(local_path)
            return True
            
        except Exception as e:
            logger.error(f"Error downloading file from Firebase: {e}")
            return False
    
    async def get_file_url(self, file_path: str) -> Optional[str]:
        """Get public URL for a file"""
        if not self.initialized:
            raise Exception("Firebase not initialized")
        
        try:
            blob = self.bucket.blob(file_path)
            return blob.public_url
            
        except Exception as e:
            logger.error(f"Error getting file URL: {e}")
            return None
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete a file from Firebase Storage"""
        if not self.initialized:
            raise Exception("Firebase not initialized")
        
        try:
            blob = self.bucket.blob(file_path)
            blob.delete()
            
            # Remove file info from Firestore
            await self._remove_file_info(file_path)
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting file from Firebase: {e}")
            return False
    
    async def list_files(self, prefix: str = "") -> List[Dict[str, Any]]:
        """List files in Firebase Storage"""
        if not self.initialized:
            raise Exception("Firebase not initialized")
        
        try:
            blobs = self.bucket.list_blobs(prefix=prefix)
            files = []
            
            for blob in blobs:
                files.append({
                    "name": blob.name,
                    "size": blob.size,
                    "content_type": blob.content_type,
                    "created": blob.time_created,
                    "updated": blob.updated,
                    "url": blob.public_url
                })
            
            return files
            
        except Exception as e:
            logger.error(f"Error listing files from Firebase: {e}")
            return []
    
    async def _store_file_info(self, file_info: Dict[str, Any]):
        """Store file information in Firestore"""
        try:
            doc_ref = self.db.collection('files').document()
            doc_ref.set(file_info)
            
        except Exception as e:
            logger.error(f"Error storing file info in Firestore: {e}")
    
    async def _remove_file_info(self, file_path: str):
        """Remove file information from Firestore"""
        try:
            # Query for the file
            docs = self.db.collection('files').where('file_path', '==', file_path).stream()
            
            for doc in docs:
                doc.reference.delete()
                
        except Exception as e:
            logger.error(f"Error removing file info from Firestore: {e}")
    
    async def get_file_info(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Get file information from Firestore"""
        try:
            docs = self.db.collection('files').where('file_path', '==', file_path).stream()
            
            for doc in docs:
                return doc.to_dict()
                
            return None
            
        except Exception as e:
            logger.error(f"Error getting file info from Firestore: {e}")
            return None

# Global Firebase service instance
firebase_service = FirebaseService() 