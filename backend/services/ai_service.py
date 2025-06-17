import openai
from typing import List, Dict, Any, Optional
from core.config import settings
import logging
import time
from models.mongodb.ai_response import AIResponse, QuizQuestion, QuizResponse, AudioResponse

logger = logging.getLogger(__name__)

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY

class AIService:
    def __init__(self):
        self.model = settings.OPENAI_MODEL
        self.max_tokens = 2000
        self.temperature = 0.7
    
    async def generate_chat_response(self, prompt: str, context: str = "", user_id: str = None) -> Dict[str, Any]:
        """Generate AI chat response"""
        start_time = time.time()
        
        try:
            # Prepare the full prompt with context
            full_prompt = f"{context}\n\nUser: {prompt}\n\nAI Assistant:"
            
            response = await openai.ChatCompletion.acreate(
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
            
            response = await openai.ChatCompletion.acreate(
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
            
            response = await openai.ChatCompletion.acreate(
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
    
    async def generate_audio_script(self, content: str, user_id: str = None) -> Dict[str, Any]:
        """Generate an audio script from content"""
        start_time = time.time()
        
        try:
            prompt = f"""
            Create an engaging audio script based on the following content. The script should be:
            1. Conversational and easy to listen to
            2. Well-structured with clear sections
            3. Include natural transitions
            4. Be suitable for text-to-speech conversion
            
            Content:
            {content}
            """
            
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert at creating engaging audio scripts for educational content."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.6
            )
            
            processing_time = time.time() - start_time
            ai_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else None
            
            # Log the response
            if user_id:
                await self._log_ai_response(
                    user_id=user_id,
                    request_type="audio_script",
                    prompt="Generate audio script from content",
                    response=ai_response,
                    tokens_used=tokens_used,
                    processing_time=processing_time
                )
            
            return {
                "audio_script": ai_response,
                "tokens_used": tokens_used,
                "processing_time": processing_time,
                "model_used": self.model
            }
            
        except Exception as e:
            logger.error(f"Error generating audio script: {e}")
            raise
    
    async def _log_ai_response(self, user_id: str, request_type: str, prompt: str, response: str, 
                              tokens_used: int = None, processing_time: float = None, 
                              room_id: str = None, topic_id: str = None, document_id: str = None,
                              metadata: Dict[str, Any] = None):
        """Log AI response to MongoDB"""
        try:
            from core.database import get_mongo_db
            db = get_mongo_db()
            
            ai_response = AIResponse(
                user_id=user_id,
                request_type=request_type,
                prompt=prompt,
                response=response,
                room_id=room_id,
                topic_id=topic_id,
                document_id=document_id,
                model_used=self.model,
                tokens_used=tokens_used,
                processing_time=processing_time,
                metadata=metadata or {}
            )
            
            await db.ai_responses.insert_one(ai_response.to_dict())
            
        except Exception as e:
            logger.error(f"Error logging AI response: {e}")

# Global AI service instance
ai_service = AIService() 