import os
import json
import hashlib
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging
from openai import OpenAI
import PyPDF2
import docx
from backend.core.config import settings
from services.encryption_service import encryption_service

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.chunk_size = 1000
        self.chunk_overlap = 200
        self.vector_db = {}  # In-memory storage for development
        self.embeddings_cache = {}
    
    async def process_document(self, file_path: str, file_id: str, user_id: str) -> Dict[str, Any]:
        """Process uploaded document and create embeddings"""
        try:
            # Extract text from document
            text_content = await self._extract_text(file_path)
            
            # Split into chunks
            chunks = self._split_text_into_chunks(text_content)
            
            # Create embeddings for each chunk
            embeddings = await self._create_embeddings(chunks)
            
            # Store in vector database
            document_data = {
                "file_id": file_id,
                "user_id": user_id,
                "chunks": chunks,
                "embeddings": embeddings,
                "metadata": {
                    "file_path": file_path,
                    "chunk_count": len(chunks),
                    "total_tokens": sum(len(chunk.split()) for chunk in chunks)
                }
            }
            
            self.vector_db[file_id] = document_data
            
            return {
                "file_id": file_id,
                "chunks_processed": len(chunks),
                "status": "success"
            }
        
        except Exception as e:
            logger.error(f"Error processing document {file_id}: {e}")
            raise
    
    async def _extract_text(self, file_path: str) -> str:
        """Extract text from different file types"""
        file_extension = Path(file_path).suffix.lower()
        
        try:
            if file_extension == '.pdf':
                return await self._extract_pdf_text(file_path)
            elif file_extension in ['.docx', '.doc']:
                return await self._extract_docx_text(file_path)
            elif file_extension in ['.txt', '.md']:
                return await self._extract_text_file(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
        
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            raise
    
    async def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            raise
    
    async def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {e}")
            raise
    
    async def _extract_text_file(self, file_path: str) -> str:
        """Extract text from plain text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            logger.error(f"Error extracting text file: {e}")
            raise
    
    def _split_text_into_chunks(self, text: str) -> List[str]:
        """Split text into overlapping chunks"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), self.chunk_size - self.chunk_overlap):
            chunk = " ".join(words[i:i + self.chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        
        return chunks
    
    async def _create_embeddings(self, chunks: List[str]) -> List[List[float]]:
        """Create embeddings for text chunks"""
        embeddings = []
        
        for chunk in chunks:
            try:
                response = self.client.embeddings.create(
                    model="text-embedding-ada-002",
                    input=chunk
                )
                embeddings.append(response.data[0].embedding)
            except Exception as e:
                logger.error(f"Error creating embedding: {e}")
                # Use zero vector as fallback
                embeddings.append([0.0] * 1536)
        
        return embeddings
    
    async def query_document(self, file_id: str, question: str, user_id: str) -> Dict[str, Any]:
        """Query a specific document with a question"""
        try:
            if file_id not in self.vector_db:
                raise ValueError("Document not found")
            
            document_data = self.vector_db[file_id]
            
            # Create embedding for the question
            question_embedding = await self._create_embeddings([question])
            question_vector = question_embedding[0]
            
            # Find most similar chunks
            similar_chunks = self._find_similar_chunks(
                question_vector, 
                document_data["embeddings"], 
                document_data["chunks"],
                top_k=3
            )
            
            # Generate answer using RAG
            answer = await self._generate_rag_answer(question, similar_chunks, file_id)
            
            return {
                "answer": answer,
                "context_chunks": similar_chunks,
                "file_id": file_id,
                "question": question
            }
        
        except Exception as e:
            logger.error(f"Error querying document {file_id}: {e}")
            raise
    
    def _find_similar_chunks(self, query_vector: List[float], embeddings: List[List[float]], 
                           chunks: List[str], top_k: int = 3) -> List[str]:
        """Find most similar chunks using cosine similarity"""
        similarities = []
        
        for i, embedding in enumerate(embeddings):
            similarity = self._cosine_similarity(query_vector, embedding)
            similarities.append((similarity, chunks[i]))
        
        # Sort by similarity and return top_k
        similarities.sort(key=lambda x: x[0], reverse=True)
        return [chunk for _, chunk in similarities[:top_k]]
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        import numpy as np
        
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    async def _generate_rag_answer(self, question: str, context_chunks: List[str], file_id: str) -> str:
        """Generate answer using RAG approach"""
        try:
            # Prepare context
            context = "\n\n".join(context_chunks)
            
            # Create system prompt for strict file-based answering
            system_prompt = f"""You are a strict document assistant. You must answer questions ONLY based on the provided document content. 

IMPORTANT RULES:
1. Only use information from the provided document context
2. If the answer is not in the document, say "I don't know" or "This information is not available in the document"
3. Do not use any external knowledge
4. Be precise and accurate
5. If you're unsure, say so

Document Context:
{context}

Question: {question}"""

            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question}
                ],
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=0.2,  # Low temperature for more focused answers
                top_p=0.9
            )
            
            return response.choices[0].message.content.strip()
        
        except Exception as e:
            logger.error(f"Error generating RAG answer: {e}")
            return "I'm sorry, I encountered an error while processing your question. Please try again."
    
    async def delete_document(self, file_id: str) -> bool:
        """Delete document from vector database"""
        try:
            if file_id in self.vector_db:
                del self.vector_db[file_id]
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting document {file_id}: {e}")
            return False
    
    async def get_document_info(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a processed document"""
        try:
            if file_id in self.vector_db:
                doc_data = self.vector_db[file_id]
                return {
                    "file_id": file_id,
                    "chunk_count": len(doc_data["chunks"]),
                    "total_tokens": doc_data["metadata"]["total_tokens"],
                    "user_id": doc_data["user_id"]
                }
            return None
        except Exception as e:
            logger.error(f"Error getting document info: {e}")
            return None

# Global RAG service instance
rag_service = RAGService() 