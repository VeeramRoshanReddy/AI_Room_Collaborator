import io
from typing import List, Optional
from uuid import uuid4
import openai
import numpy as np
from pinecone import Pinecone
from sqlalchemy.orm import Session
from models.postgresql.note import Note
from models.postgresql.user import User
from models.postgresql.chat_log import ChatLog
from core.config import settings

try:
    import pdfplumber
except ImportError:
    pdfplumber = None
try:
    import docx
except ImportError:
    docx = None

# Set your OpenAI API key here or via environment variable
openai.api_key = settings.OPENAI_KEY

# Initialize Pinecone (new SDK)
pc = Pinecone(api_key=settings.VECTOR_DB_API_KEY)
INDEX_NAME = 'ai-learning-notes'
index = pc.Index(INDEX_NAME)

class RAGService:
    def __init__(self):
        self.index = index

    def extract_text(self, file_bytes: bytes, filename: str) -> str:
        if filename.lower().endswith('.pdf'):
            if not pdfplumber:
                raise ImportError('pdfplumber is required for PDF extraction')
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                return '\n'.join(page.extract_text() or '' for page in pdf.pages)
        elif filename.lower().endswith('.docx'):
            if not docx:
                raise ImportError('python-docx is required for DOCX extraction')
            doc = docx.Document(io.BytesIO(file_bytes))
            return '\n'.join([para.text for para in doc.paragraphs])
        else:
            raise ValueError('Unsupported file type')

    def chunk_text(self, text: str, chunk_size: int = 500) -> List[str]:
        words = text.split()
        return [' '.join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]

    def embed_chunks(self, chunks: List[str]) -> List[List[float]]:
        response = openai.Embedding.create(
            input=chunks,
            model='text-embedding-ada-002'
        )
        return [d['embedding'] for d in response['data']]

    def store_note(self, db: Session, user_id: str, file_bytes: bytes, filename: str, note_title: Optional[str] = None) -> str:
        text = self.extract_text(file_bytes, filename)
        chunks = self.chunk_text(text)
        embeddings = self.embed_chunks(chunks)
        note_id = str(uuid4())
        # Store metadata in DB
        note = Note(id=note_id, user_id=user_id, title=note_title or filename, content=text)
        db.add(note)
        db.commit()
        db.refresh(note)
        # Store chunks in Pinecone (track chunk_ids for deletion)
        pinecone_vectors = []
        chunk_ids = []
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            chunk_id = f"{note_id}-{i}"
            chunk_ids.append(chunk_id)
            pinecone_vectors.append((chunk_id, emb, {"note_id": note_id, "user_id": user_id, "chunk": chunk}))
        self.index.upsert(vectors=pinecone_vectors)
        # Optionally, store chunk_ids in your DB for later deletion
        return note_id

    def query(self, db: Session, note_id: str, question: str, user_id: str, top_k: int = 3) -> str:
        # Embed the question
        q_emb = self.embed_chunks([question])[0]
        # Query Pinecone for top_k similar chunks (filter by note_id and user_id)
        results = self.index.query(vector=q_emb, top_k=top_k, include_metadata=True, filter={"note_id": note_id, "user_id": user_id})
        context = '\n'.join([match['metadata']['chunk'] for match in results['matches']])
        # Call LLM with context
        prompt = f"""
You are a helpful assistant. Only answer based on the context below. 
If the answer isn't found in the context, reply 'This information is not present in the uploaded file.'

Context:
{context}

User Question: {question}
"""
        response = openai.Completion.create(
            model='text-davinci-003',
            prompt=prompt,
            max_tokens=256,
            temperature=0.2
        )
        answer = response.choices[0].text.strip()
        # Store conversation in DB
        chat_log = ChatLog(user_id=user_id, note_id=note_id, question=question, answer=answer)
        db.add(chat_log)
        db.commit()
        return answer

    def delete_note_vectors(self, note_id: str, user_id: str, chunk_ids: List[str]):
        # Delete all vectors for a note (must track chunk_ids in your DB)
        self.index.delete(ids=chunk_ids)

rag_service = RAGService() 