import openai
from typing import List, Dict, Any, Optional
from core.config import settings
import logging
import time
from models.mongodb.ai_response import AIResponse, QuizQuestion, QuizResponse, AudioResponse
from services.encryption_service import encryption_service
import json
import re
from datetime import datetime

logger = logging.getLogger(__name__)

# Configure OpenAI
client = openai.OpenAI(api_key=settings.OPENAI_KEY)

class AIService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_KEY)
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.temperature = settings.OPENAI_TEMPERATURE
    
    async def get_chatbot_response(self, question: str, context: str = "", chat_history: List[Dict] = None) -> str:
        """Get AI chatbot response for a question"""
        try:
            if not settings.OPENAI_KEY:
                return "AI service is not configured. Please set OPENAI_KEY in environment."
            
            # Prepare system message
            system_message = """You are a helpful AI assistant in a collaborative learning environment. 
            You help users with their questions about documents, topics, and general knowledge.
            Be concise, accurate, and helpful. If you don't know something, say so."""
            
            if context:
                system_message += f"\n\nContext from uploaded document: {context}"
            
            # Prepare messages
            messages = [{"role": "system", "content": system_message}]
            
            # Add chat history if provided
            if chat_history:
                for msg in chat_history[-10:]:  # Last 10 messages for context
                    if msg.get("is_ai"):
                        messages.append({"role": "assistant", "content": msg.get("content", "")})
                    else:
                        messages.append({"role": "user", "content": msg.get("content", "")})
            
            # Add current question
            messages.append({"role": "user", "content": question})
            
            # Get response from OpenAI
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error getting chatbot response: {e}")
            return "Sorry, I'm having trouble processing your request right now."
    
    async def generate_document_summary(self, document_content: str) -> str:
        """Generate a summary of uploaded document"""
        try:
            if not settings.OPENAI_KEY:
                return "AI service is not configured. Please set OPENAI_KEY in environment."
            
            system_message = """You are an expert at summarizing documents. 
            Provide a clear, concise summary of the key points and main ideas from the document.
            Focus on the most important information that would be useful for learning and discussion."""
            
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": f"Please summarize this document:\n\n{document_content}"}
            ]
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=0.3  # Lower temperature for more focused summaries
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating document summary: {e}")
            return "Unable to generate summary at this time."
    
    async def generate_quiz_questions(self, document_content: str, num_questions: int = 10, difficulty: str = "medium") -> List[Dict]:
        """Generate MCQ quiz questions from document content"""
        try:
            if not settings.OPENAI_KEY:
                return []
            
            system_message = f"""You are an expert at creating multiple choice questions for educational purposes.
            Create {num_questions} questions based on the document content.
            Difficulty level: {difficulty}
            
            For each question, provide:
            1. A clear question
            2. 4 answer options (A, B, C, D)
            3. The correct answer (A, B, C, or D)
            4. A brief explanation of why the answer is correct
            
            Format your response as a JSON array with objects containing:
            - question: the question text
            - options: array of 4 options
            - correct_answer: index of correct option (0-3)
            - explanation: brief explanation
            - difficulty: the difficulty level"""
            
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": f"Generate quiz questions from this document:\n\n{document_content}"}
            ]
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens * 2,  # More tokens for quiz generation
                temperature=0.7
            )
            
            # Parse JSON response
            try:
                content = response.choices[0].message.content.strip()
                # Extract JSON from response (in case there's extra text)
                json_match = re.search(r'\[.*\]', content, re.DOTALL)
                if json_match:
                    questions = json.loads(json_match.group())
                else:
                    questions = json.loads(content)
                
                # Validate and clean questions
                cleaned_questions = []
                for q in questions:
                    if isinstance(q, dict) and 'question' in q and 'options' in q and 'correct_answer' in q:
                        cleaned_questions.append({
                            'question': q['question'],
                            'options': q['options'][:4],  # Ensure exactly 4 options
                            'correct_answer': min(q['correct_answer'], 3),  # Ensure valid index
                            'explanation': q.get('explanation', ''),
                            'difficulty': q.get('difficulty', difficulty)
                        })
                
                return cleaned_questions[:num_questions]  # Ensure correct number
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing quiz JSON: {e}")
                return []
            
        except Exception as e:
            logger.error(f"Error generating quiz questions: {e}")
            return []
    
    async def generate_audio_overview_script(self, document_content: str) -> Dict[str, str]:
        """Generate a podcast-style audio overview script"""
        try:
            if not settings.OPENAI_KEY:
                return {
                    "host_script": "AI service is not configured.",
                    "expert_script": "Please set OPENAI_KEY in environment."
                }
            
            system_message = """You are creating a podcast-style audio overview of a document.
            Create a conversation between a host and a domain expert.
            
            The host should:
            - Ask engaging questions
            - Guide the conversation
            - Summarize key points
            
            The domain expert should:
            - Provide detailed explanations
            - Share insights and context
            - Make complex topics accessible
            
            Format your response as JSON with:
            - host_script: The host's part of the conversation
            - expert_script: The expert's part of the conversation
            
            Make it engaging, educational, and conversational."""
            
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": f"Create a podcast overview of this document:\n\n{document_content}"}
            ]
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens * 2,
                temperature=0.8
            )
            
            # Parse JSON response
            try:
                content = response.choices[0].message.content.strip()
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    script = json.loads(json_match.group())
                else:
                    script = json.loads(content)
                
                return {
                    "host_script": script.get("host_script", "Host script not generated."),
                    "expert_script": script.get("expert_script", "Expert script not generated.")
                }
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing audio script JSON: {e}")
                return {
                    "host_script": "Error generating host script.",
                    "expert_script": "Error generating expert script."
                }
            
        except Exception as e:
            logger.error(f"Error generating audio overview script: {e}")
            return {
                "host_script": "Unable to generate audio overview at this time.",
                "expert_script": "Please try again later."
            }
    
    async def analyze_document_for_quiz(self, document_content: str) -> Dict[str, Any]:
        """Analyze document to determine suitable quiz topics and difficulty"""
        try:
            if not settings.OPENAI_KEY:
                return {"topics": [], "suggested_difficulty": "medium", "estimated_questions": 5}
            
            system_message = """Analyze this document to determine:
            1. Main topics and themes
            2. Suitable difficulty level for quiz questions
            3. Estimated number of questions that can be generated
            
            Return your analysis as JSON with:
            - topics: array of main topics
            - suggested_difficulty: "easy", "medium", or "hard"
            - estimated_questions: number of questions that can be generated
            - key_concepts: array of important concepts"""
            
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": f"Analyze this document:\n\n{document_content}"}
            ]
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=0.3
            )
            
            # Parse JSON response
            try:
                content = response.choices[0].message.content.strip()
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    analysis = json.loads(json_match.group())
                else:
                    analysis = json.loads(content)
                
                return {
                    "topics": analysis.get("topics", []),
                    "suggested_difficulty": analysis.get("suggested_difficulty", "medium"),
                    "estimated_questions": analysis.get("estimated_questions", 5),
                    "key_concepts": analysis.get("key_concepts", [])
                }
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing document analysis JSON: {e}")
                return {"topics": [], "suggested_difficulty": "medium", "estimated_questions": 5}
            
        except Exception as e:
            logger.error(f"Error analyzing document: {e}")
            return {"topics": [], "suggested_difficulty": "medium", "estimated_questions": 5}
    
    async def extract_text_from_document(self, file_content: bytes, file_type: str) -> str:
        """Extract text content from uploaded document"""
        try:
            if file_type.lower() == "pdf":
                return await self._extract_text_from_pdf(file_content)
            elif file_type.lower() in ["doc", "docx"]:
                return await self._extract_text_from_word(file_content)
            elif file_type.lower() == "txt":
                return file_content.decode('utf-8', errors='ignore')
            else:
                return "Unsupported file type for text extraction."
                
        except Exception as e:
            logger.error(f"Error extracting text from document: {e}")
            return "Error extracting text from document."
    
    async def _extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF file"""
        try:
            import PyPDF2
            from io import BytesIO
            
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return "Error extracting text from PDF file."
    
    async def _extract_text_from_word(self, file_content: bytes) -> str:
        """Extract text from Word document"""
        try:
            from docx import Document
            from io import BytesIO
            
            doc_file = BytesIO(file_content)
            doc = Document(doc_file)
            
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting text from Word document: {e}")
            return "Error extracting text from Word document."

# Global AI service instance
ai_service = AIService() 