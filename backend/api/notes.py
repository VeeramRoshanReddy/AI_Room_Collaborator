from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import List, Dict, Any, Optional
import os
import uuid
from datetime import datetime
from pydantic import BaseModel
import logging

from services.rag_service import rag_service
from services.encryption_service import encryption_service
from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models
class DocumentUpload(BaseModel):
    user_id: str
    file_name: str
    file_type: str

class DocumentQuery(BaseModel):
    file_id: str
    user_id: str
    question: str

class DocumentInfo(BaseModel):
    file_id: str
    user_id: str
    file_name: str
    file_type: str
    chunk_count: int
    total_tokens: int
    upload_date: datetime
    status: str

class QueryResponse(BaseModel):
    answer: str
    context_chunks: List[str]
    file_id: str
    question: str
    confidence: float
    processing_time: float

# In-memory document storage (replace with database in production)
documents: Dict[str, Dict] = {}

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = None
):
    """Upload and process a document for RAG-based QA"""
    try:
        # Validate file type
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in settings.ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not supported. Allowed types: {settings.ALLOWED_FILE_TYPES}"
            )
        
        # Validate file size
        if file.size and file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE} bytes"
            )
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        
        # Create upload directory if it doesn't exist
        upload_dir = settings.UPLOAD_DIR
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_dir, f"{file_id}_{file.filename}")
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process document with RAG service
        processing_result = await rag_service.process_document(
            file_path=file_path,
            file_id=file_id,
            user_id=user_id or "anonymous"
        )
        
        # Store document info
        document_info = {
            "file_id": file_id,
            "user_id": user_id or "anonymous",
            "file_name": file.filename,
            "file_type": file_extension,
            "file_path": file_path,
            "chunk_count": processing_result["chunks_processed"],
            "total_tokens": 0,  # Will be updated by RAG service
            "upload_date": datetime.now(),
            "status": "processed",
            "file_size": file.size
        }
        
        documents[file_id] = document_info
        
        # Get detailed info from RAG service
        rag_info = await rag_service.get_document_info(file_id)
        if rag_info:
            document_info["total_tokens"] = rag_info["total_tokens"]
        
        return {
            "file_id": file_id,
            "file_name": file.filename,
            "status": "success",
            "chunks_processed": processing_result["chunks_processed"],
            "message": "Document uploaded and processed successfully"
        }
    
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@router.post("/query", response_model=QueryResponse)
async def query_document(query: DocumentQuery):
    """Query a document with a question using RAG"""
    try:
        # Check if document exists
        if query.file_id not in documents:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Check if user has access to the document
        document_info = documents[query.file_id]
        if document_info["user_id"] != query.user_id:
            raise HTTPException(status_code=403, detail="Access denied to this document")
        
        # Query the document using RAG
        start_time = datetime.now()
        rag_response = await rag_service.query_document(
            file_id=query.file_id,
            question=query.question,
            user_id=query.user_id
        )
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Calculate confidence based on context relevance
        confidence = min(1.0, len(rag_response["context_chunks"]) / 3.0)
        
        return QueryResponse(
            answer=rag_response["answer"],
            context_chunks=rag_response["context_chunks"],
            file_id=query.file_id,
            question=query.question,
            confidence=confidence,
            processing_time=processing_time
        )
    
    except Exception as e:
        logger.error(f"Error querying document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to query document: {str(e)}")

@router.get("/documents/{user_id}")
async def get_user_documents(user_id: str):
    """Get all documents for a user"""
    try:
        user_documents = []
        for file_id, doc_info in documents.items():
            if doc_info["user_id"] == user_id:
                user_documents.append({
                    "file_id": file_id,
                    "file_name": doc_info["file_name"],
                    "file_type": doc_info["file_type"],
                    "chunk_count": doc_info["chunk_count"],
                    "total_tokens": doc_info["total_tokens"],
                    "upload_date": doc_info["upload_date"],
                    "status": doc_info["status"],
                    "file_size": doc_info.get("file_size", 0)
                })
        
        return {
            "user_id": user_id,
            "documents": user_documents,
            "total_documents": len(user_documents)
        }
    
    except Exception as e:
        logger.error(f"Error getting user documents: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user documents")

@router.get("/document/{file_id}")
async def get_document_info(file_id: str, user_id: str):
    """Get information about a specific document"""
    try:
        if file_id not in documents:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document_info = documents[file_id]
        
        # Check access
        if document_info["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied to this document")
        
        return {
            "file_id": file_id,
            "file_name": document_info["file_name"],
            "file_type": document_info["file_type"],
            "chunk_count": document_info["chunk_count"],
            "total_tokens": document_info["total_tokens"],
            "upload_date": document_info["upload_date"],
            "status": document_info["status"],
            "file_size": document_info.get("file_size", 0)
        }
    
    except Exception as e:
        logger.error(f"Error getting document info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get document info")

@router.delete("/document/{file_id}")
async def delete_document(file_id: str, user_id: str):
    """Delete a document"""
    try:
        if file_id not in documents:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document_info = documents[file_id]
        
        # Check access
        if document_info["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied to this document")
        
        # Delete from RAG service
        await rag_service.delete_document(file_id)
        
        # Delete physical file
        try:
            if os.path.exists(document_info["file_path"]):
                os.remove(document_info["file_path"])
        except Exception as e:
            logger.warning(f"Failed to delete physical file: {e}")
        
        # Remove from documents dict
        del documents[file_id]
        
        return {
            "message": "Document deleted successfully",
            "file_id": file_id
        }
    
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete document")

@router.post("/document/{file_id}/summary")
async def generate_document_summary(file_id: str, user_id: str):
    """Generate a summary of the document"""
    try:
        if file_id not in documents:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document_info = documents[file_id]
        
        # Check access
        if document_info["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied to this document")
        
        # Get document info from RAG service
        rag_info = await rag_service.get_document_info(file_id)
        if not rag_info:
            raise HTTPException(status_code=404, detail="Document not found in RAG system")
        
        # Generate summary using AI service
        from services.ai_service import ai_service
        
        # Get all chunks for summary
        document_data = rag_service.vector_db.get(file_id)
        if not document_data:
            raise HTTPException(status_code=404, detail="Document data not found")
        
        # Combine all chunks for summary
        full_content = "\n\n".join(document_data["chunks"])
        
        summary_response = await ai_service.generate_summary(
            content=full_content,
            user_id=user_id
        )
        
        return {
            "file_id": file_id,
            "summary": summary_response["summary"],
            "total_tokens": summary_response.get("tokens_used", 0),
            "processing_time": summary_response.get("processing_time", 0)
        }
    
    except Exception as e:
        logger.error(f"Error generating document summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate document summary")

@router.get("/health")
async def health_check():
    """Health check for the notes service"""
    return {
        "status": "healthy",
        "service": "notes",
        "timestamp": datetime.now().isoformat(),
        "encryption_enabled": settings.CHAT_ENCRYPTION_ENABLED
    } 