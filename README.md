# StudyBuddy

An AI-powered platform for collaborative learning: real-time study rooms with an AI chatbot, personal notes with document Q&A, quiz generation, and audio overviews.

## Features

- **Authentication** — email/password signup and login with JWT bearer tokens.
- **Study Rooms** — 8-digit room IDs, password-protected join, admin/member roles, topic-based discussions.
- **Real-time Chat** — WebSocket-based group chat per room/topic, with encrypted message storage and an `@chatbot` AI assistant.
- **Personal Notes** — upload PDF/DOC/DOCX/TXT files, get an AI-generated summary, and ask questions about the document's content (RAG over the uploaded text).
- **Quizzes** — AI-generated multiple-choice quizzes from an uploaded note.
- **Audio Overviews** — AI-scripted host/expert dialogue, synthesized into a podcast-style MP3 via ElevenLabs.

## Tech Stack

**Backend:** FastAPI, SQLAlchemy (PostgreSQL), Motor (MongoDB), Pinecone (vector search for note Q&A), OpenAI (chat + embeddings), ElevenLabs (audio synthesis), AWS S3 (file storage), Fernet (message encryption).

**Frontend:** React, styled-components, React Router, Axios, Framer Motion.

## Architecture

- REST API mounted under `/api/v1` (auth, users, rooms, topics, notes, chat history, quizzes, audio).
- A single WebSocket endpoint at `/ws/{room_id}/{topic_id}` handles real-time chat, typing indicators, read receipts, and the `@chatbot` AI trigger.
- Notes use a simple RAG pipeline: uploaded documents are chunked, embedded with OpenAI, and stored in Pinecone; questions are answered by retrieving the closest chunks and asking the LLM to answer using only that context.

## Project Structure

```
backend/
├── api/            # REST route handlers
├── core/           # config, database connections, JWT/password security, the live chat websocket
├── middleware/     # auth dependencies (REST + websocket)
├── models/         # SQLAlchemy (postgresql/) and Pydantic (mongodb/) models
├── services/       # AI, RAG, encryption, storage, ElevenLabs integrations
└── main.py         # app entry point

frontend/
├── src/
│   ├── components/ # auth, layout (navbar/sidebar), room & notes UI
│   ├── context/    # auth state (UserContext)
│   └── utils/      # API base URL / websocket URL helpers
└── public/
```

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18–20
- A PostgreSQL database, a MongoDB database, and (optionally) a Pinecone index, OpenAI key, ElevenLabs account, and AWS S3 bucket — see [Environment Variables](#environment-variables) below.

### Backend

```bash
cd backend
pip install -r requirements.txt
# create a .env file (see Environment Variables below)
uvicorn main:app --reload
```

The API is then available at `http://localhost:8000` (`/docs` for Swagger UI).

### Frontend

```bash
cd frontend
npm install
# create a .env file:
#   REACT_APP_API_URL=http://localhost:8000/api/v1
#   REACT_APP_WS_URL=ws://localhost:8000/ws
npm start
```

The app is then available at `http://localhost:3000`.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | JWT signing secret |
| `ENCRYPTION_KEY` | Fernet key used to encrypt chat messages (generate with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `MONGODB_URL` | MongoDB connection string |
| `OPENAI_KEY` | OpenAI API key — powers chat responses, summaries, quizzes, and embeddings |
| `VECTOR_DB_URL`, `VECTOR_DB_API_KEY` | Pinecone connection details — powers note Q&A (RAG). The app still runs without these; only note Q&A is disabled. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION` | S3 storage for uploaded note files and generated audio |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_HOST_VOICE_ID`, `ELEVENLABS_EXPERT_VOICE_ID` | Audio overview synthesis |
| `DEBUG` | `True`/`False` — defaults to `False` |

### Frontend (`frontend/.env`)

| Variable | Purpose |
|---|---|
| `REACT_APP_API_URL` | Backend REST API base URL |
| `REACT_APP_WS_URL` | Backend WebSocket base URL |

## Deployment

- **Backend:** deployed on [Render](https://render.com) using `backend/render.yaml` (set the secret env vars from the table above in the Render dashboard).
- **Frontend:** deployed on [Vercel](https://vercel.com) using `vercel.json`, which proxies `/api/*` to the Render backend.

## Running Tests

```bash
cd backend
pytest
```
