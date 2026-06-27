import io
import logging
from typing import List, Optional
from uuid import uuid4
import openai
from pinecone import Pinecone
from sqlalchemy.orm import Session
from models.postgresql.note import Note
from models.postgresql.user import User
from models.postgresql.chat_log import ChatLog
from core.config import settings

logger = logging.getLogger(__name__)

try:
    import pdfplumber
except ImportError:
    pdfplumber = None
try:
    import docx
except ImportError:
    docx = None

client = openai.OpenAI(api_key=settings.OPENAI_KEY) if settings.OPENAI_KEY else None

# Pinecone holds the document chunk embeddings used for RAG note Q&A. Init is
# wrapped so a missing/invalid key disables RAG features instead of crashing
# the whole app at import time (notes.py imports this module on startup).
index = None
try:
    if settings.VECTOR_DB_API_KEY:
        pc = Pinecone(api_key=settings.VECTOR_DB_API_KEY)
        index = pc.Index(settings.VECTOR_DB_INDEX_NAME)
except Exception as e:
    logger.warning(f"Pinecone init failed, RAG features disabled: {e}")


class RAGService:
    def __init__(self):
        self.index = index

    def _check_configured(self):
        if not client or not self.index:
            raise RuntimeError("RAG is not configured (missing OPENAI_KEY or VECTOR_DB_API_KEY)")

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
        return [' '.join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]

    def embed_chunks(self, chunks: List[str]) -> List[List[float]]:
        response = client.embeddings.create(input=chunks, model='text-embedding-ada-002')
        return [d.embedding for d in response.data]

    def embed_and_store_chunks(self, note_id: str, user_id: str, text: str) -> List[str]:
        """Chunk + embed + upsert text into Pinecone for an existing note. Returns chunk ids."""
        self._check_configured()
        chunks = self.chunk_text(text)
        if not chunks:
            return []
        embeddings = self.embed_chunks(chunks)
        chunk_ids = []
        pinecone_vectors = []
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            chunk_id = f"{note_id}-{i}"
            chunk_ids.append(chunk_id)
            pinecone_vectors.append((chunk_id, emb, {"note_id": note_id, "user_id": user_id, "chunk": chunk}))
        self.index.upsert(vectors=pinecone_vectors)
        return chunk_ids

    def store_note(self, db: Session, user_id: str, file_bytes: bytes, filename: str, note_title: Optional[str] = None) -> str:
        self._check_configured()
        text = self.extract_text(file_bytes, filename)
        note_id = str(uuid4())
        note = Note(id=note_id, user_id=user_id, title=note_title or filename, content=text)
        db.add(note)
        db.commit()
        db.refresh(note)
        self.embed_and_store_chunks(note_id, user_id, text)
        return note_id

    def query(self, db: Session, note_id: str, question: str, user_id: str, top_k: int = 3) -> str:
        self._check_configured()
        # RAG pipeline: embed the question, find the closest stored chunks for
        # this note via Pinecone similarity search, then ask the LLM to answer
        # using only that retrieved context.
        q_emb = self.embed_chunks([question])[0]
        results = self.index.query(vector=q_emb, top_k=top_k, include_metadata=True, filter={"note_id": note_id, "user_id": user_id})
        context = '\n'.join([match['metadata']['chunk'] for match in results['matches']])

        prompt = f"""You are a helpful assistant. Only answer based on the context below.
If the answer isn't found in the context, reply 'This information is not present in the uploaded file.'

Context:
{context}

User Question: {question}"""

        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You answer questions using only the provided document context."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=256,
            temperature=0.2,
        )
        answer = response.choices[0].message.content.strip()

        chat_log = ChatLog(user_id=user_id, note_id=note_id, question=question, answer=answer)
        db.add(chat_log)
        db.commit()
        return answer

    def delete_note_vectors(self, note_id: str, user_id: str, chunk_ids: List[str]):
        self._check_configured()
        self.index.delete(ids=chunk_ids)


rag_service = RAGService()
