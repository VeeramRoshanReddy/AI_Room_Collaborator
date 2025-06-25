import openai
from typing import List, Dict, Any, Optional
from core.config import settings
import logging
import time
from models.mongodb.ai_response import AIResponse, QuizQuestion, QuizResponse, AudioResponse
from services.encryption_service import encryption_service

logger = logging.getLogger(__name__)

# Configure OpenAI
client = openai.OpenAI(api_key=settings.OPENAI_KEY)

class AIService:
    def __init__(self):
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.temperature = settings.OPENAI_TEMPERATURE
    
    async def generate_group_chat_response(self, message: str, chat_history: List[Dict], room_id: str, user_id: str = None) -> Dict[str, Any]:
        """Generate AI response for group chat (open-ended)"""
        start_time = time.time()
        
        try:
            # Prepare chat history for context
            formatted_history = self._format_chat_history(chat_history)
            
            # Create system prompt for group chat
            system_prompt = """You are an educational assistant helping students discuss classroom topics. 
            Engage helpfully in group discussions by:
            1. Providing relevant insights and explanations
            2. Asking clarifying questions when needed
            3. Encouraging collaborative thinking
            4. Being supportive and educational
            5. Staying on topic and contributing meaningfully to the conversation
            
            Respond naturally as if you're part of the group discussion."""
            
            # Prepare messages for OpenAI
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add chat history
            for msg in formatted_history[-10:]:  # Last 10 messages for context
                messages.append(msg)
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            response = client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=0.7,  # Slightly higher for more engaging responses
                top_p=0.9
            )
            
            processing_time = time.time() - start_time
            ai_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else None
            
            # Encrypt the response for end-to-end security
            encrypted_response = encryption_service.encrypt_message(ai_response, room_id)
            
            # Log the response
            if user_id:
                await self._log_ai_response(
                    user_id=user_id,
                    request_type="group_chat",
                    prompt=message,
                    response=ai_response,
                    tokens_used=tokens_used,
                    processing_time=processing_time,
                    room_id=room_id
                )
            
            return {
                "response": encrypted_response,
                "original_response": ai_response,  # For logging purposes
                "tokens_used": tokens_used,
                "processing_time": processing_time,
                "model_used": self.model,
                "is_encrypted": True
            }
            
        except Exception as e:
            logger.error(f"Error generating group chat response: {e}")
            raise
    
    def _format_chat_history(self, chat_history: List[Dict]) -> List[Dict]:
        """Format chat history for OpenAI API"""
        formatted = []
        
        for msg in chat_history:
            if msg.get("type") == "user":
                formatted.append({"role": "user", "content": msg.get("content", "")})
            elif msg.get("type") == "ai":
                formatted.append({"role": "assistant", "content": msg.get("content", "")})
            elif msg.get("type") == "system":
                formatted.append({"role": "system", "content": msg.get("content", "")})
        
        return formatted
    
    async def generate_chat_response(self, prompt: str, context: str = "", user_id: str = None) -> Dict[str, Any]:
        """Generate AI chat response (legacy method)"""
        start_time = time.time()
        
        try:
            # Prepare the full prompt with context
            full_prompt = f"{context}\n\nUser: {prompt}\n\nAI Assistant:"
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant for an educational platform. Provide clear, accurate, and educational responses."},
                    {"role": "user", "content": full_prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            processing_time = time.time() - start_time
            ai_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else None
            
            # Log the response
            if user_id:
                await self._log_ai_response(
                    user_id=user_id,
                    request_type="chat",
                    prompt=prompt,
                    response=ai_response,
                    tokens_used=tokens_used,
                    processing_time=processing_time
                )
            
            return {
                "response": ai_response,
                "tokens_used": tokens_used,
                "processing_time": processing_time,
                "model_used": self.model
            }
            
        except Exception as e:
            logger.error(f"Error generating chat response: {e}")
            raise
    
    async def generate_quiz(self, content: str, difficulty: str = "medium", num_questions: int = 5, user_id: str = None) -> Dict[str, Any]:
        """Generate quiz questions from content"""
        start_time = time.time()
        
        try:
            prompt = f"""
            Create a {difficulty} difficulty quiz with {num_questions} multiple choice questions based on the following content:
            
            {content}
            
            Format the response as a JSON object with the following structure:
            {{
                "questions": [
                    {{
                        "question": "Question text",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": 0,
                        "explanation": "Explanation of the correct answer"
                    }}
                ]
            }}
            
            Make sure the questions are relevant to the content and have clear, distinct options.
            """
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert quiz generator. Create educational and engaging multiple choice questions."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=3000,
                temperature=0.5
            )
            
            processing_time = time.time() - start_time
            ai_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else None
            
            # Parse the JSON response
            import json
            try:
                quiz_data = json.loads(ai_response)
                questions = quiz_data.get("questions", [])
                
                # Convert to QuizQuestion objects
                quiz_questions = []
                for q in questions:
                    quiz_questions.append(QuizQuestion(
                        question=q["question"],
                        options=q["options"],
                        correct_answer=q["correct_answer"],
                        explanation=q.get("explanation", ""),
                        difficulty=difficulty
                    ))
                
                # Log the response
                if user_id:
                    await self._log_ai_response(
                        user_id=user_id,
                        request_type="quiz",
                        prompt=f"Generate {num_questions} {difficulty} questions from content",
                        response=ai_response,
                        tokens_used=tokens_used,
                        processing_time=processing_time,
                        metadata={"difficulty": difficulty, "num_questions": num_questions}
                    )
                
                return {
                    "questions": quiz_questions,
                    "total_questions": len(quiz_questions),
                    "difficulty": difficulty,
                    "tokens_used": tokens_used,
                    "processing_time": processing_time,
                    "model_used": self.model
                }
                
            except json.JSONDecodeError:
                logger.error("Failed to parse quiz JSON response")
                raise ValueError("Failed to generate quiz questions")
            
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            raise
    
    async def generate_summary(self, content: str, user_id: str = None) -> Dict[str, Any]:
        """Generate a summary of the content"""
        start_time = time.time()
        
        try:
            prompt = f"""
            Provide a comprehensive summary of the following content in a clear and educational manner:
            
            {content}
            
            The summary should:
            1. Cover the main points and key concepts
            2. Be well-structured and easy to understand
            3. Include important details and examples
            4. Be suitable for educational purposes
            """
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert at creating educational summaries."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                temperature=0.3
            )
            
            processing_time = time.time() - start_time
            ai_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else None
            
            # Log the response
            if user_id:
                await self._log_ai_response(
                    user_id=user_id,
                    request_type="summary",
                    prompt="Generate summary of content",
                    response=ai_response,
                    tokens_used=tokens_used,
                    processing_time=processing_time
                )
            
            return {
                "summary": ai_response,
                "tokens_used": tokens_used,
                "processing_time": processing_time,
                "model_used": self.model
            }
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            raise
    
    async def generate_audio_transcript(self, audio_file_path: str, user_id: str = None) -> Dict[str, Any]:
        """Generate transcript from audio file"""
        start_time = time.time()
        
        try:
            with open(audio_file_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            
            processing_time = time.time() - start_time
            
            # Log the response
            if user_id:
                await self._log_ai_response(
                    user_id=user_id,
                    request_type="audio_transcript",
                    prompt=f"Transcribe audio file: {audio_file_path}",
                    response=transcript.text,
                    processing_time=processing_time
                )
            
            return {
                "transcript": transcript.text,
                "processing_time": processing_time,
                "model_used": "whisper-1"
            }
            
        except Exception as e:
            logger.error(f"Error generating audio transcript: {e}")
            raise
    
    async def _log_ai_response(self, user_id: str, request_type: str, prompt: str, response: str, 
                              tokens_used: int = None, processing_time: float = None, 
                              room_id: str = None, topic_id: str = None, document_id: str = None,
                              metadata: Dict[str, Any] = None):
        """Log AI response to database"""
        try:
            ai_response = AIResponse(
                user_id=user_id,
                request_type=request_type,
                prompt=prompt,
                response=response,
                tokens_used=tokens_used,
                processing_time=processing_time,
                room_id=room_id,
                topic_id=topic_id,
                document_id=document_id,
                metadata=metadata or {}
            )
            
            # Save to database (implement based on your database setup)
            # await ai_response.save()
            
        except Exception as e:
            logger.error(f"Error logging AI response: {e}")

# Global AI service instance
ai_service = AIService() 