import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { FaFileUpload, FaRobot, FaUserCircle, FaTrash, FaBroom, FaPlay, FaDownload, FaQuestionCircle } from 'react-icons/fa';

const GlassContainer = styled.div`
  display: flex;
  gap: 32px;
  height: 100%;
  min-height: 0;
  font-family: 'Poppins', 'Inter', 'Montserrat', sans-serif;
  overflow: hidden;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(8px) saturate(1.2);
`;

const ChatSection = styled.div`
  flex: 0 0 65%;
  display: flex;
  flex-direction: column;
  background: rgba(255,255,255,0.7);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.12);
  overflow: hidden;
  min-width: 0;
  height: 100%;
  transition: box-shadow 0.2s;
`;

const RightSection = styled.div`
  flex: 0 0 35%;
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-width: 0;
  height: 100%;
`;

const GlassBox = styled.div`
  background: rgba(255,255,255,0.7);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.12);
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
  transition: box-shadow 0.2s, background 0.2s;
`;

const AudioSection = styled(GlassBox)`
  flex: 0 0 30%;
  height: 30%;
`;

const QuizSection = styled(GlassBox)`
  flex: 0 0 70%;
  height: 70%;
`;

const UploadArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  border: 2.5px dashed #60a5fa;
  border-radius: 24px;
  background: rgba(224,231,239,0.7);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  width: 90%;
  margin: 0 auto;
  max-width: 700px;
  box-shadow: 0 4px 24px rgba(59, 130, 246, 0.10);
  &:hover {
    border-color: #3b82f6;
    background: rgba(224,231,239,0.95);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.18);
  }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow-y: auto;
  background: transparent;
`;

const ChatInput = styled.div`
  padding: 24px;
  border-top: 1.5px solid #e0e7ef;
  display: flex;
  gap: 12px;
  background: transparent;
`;

const Input = styled.input`
  flex: 1;
  padding: 14px 18px;
  border: 1.5px solid #60a5fa;
  border-radius: 16px;
  font-size: 15px;
  background: rgba(255,255,255,0.9);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
  transition: border 0.2s, box-shadow 0.2s;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.12);
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.10);
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  &:hover {
    background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.18);
    transform: translateY(-2px) scale(1.03);
  }
  &:active {
    transform: scale(0.98);
  }
  &:disabled {
    background: #e0e7ef;
    color: #b6c2d6;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const Message = styled.div`
  display: flex;
  gap: 14px;
  margin-bottom: 18px;
  align-items: flex-end;
  flex-direction: ${props => props.isUser ? 'row-reverse' : 'row'};
`;

const MessageContent = styled.div`
  max-width: 70%;
  padding: 14px 18px;
  border-radius: 18px;
  background: ${props => props.isUser ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' : 'rgba(224,231,239,0.8)'};
  color: ${props => props.isUser ? 'white' : '#1e293b'};
  font-size: 15px;
  line-height: 1.5;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
  transition: background 0.2s, box-shadow 0.2s;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.isUser ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' : 'rgba(224,231,239,0.8)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isUser ? 'white' : '#3b82f6'};
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
`;

const DocumentStatus = styled.div`
  padding: 16px 24px;
  background: rgba(224,231,239,0.7);
  border-bottom: 1.5px solid #e0e7ef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
`;

const StatusText = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1e293b;
  font-size: 15px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const QuizQuestion = styled.div`
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(224,231,239,0.7);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
`;

const QuestionText = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const Options = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Option = styled.button`
  padding: 12px 16px;
  border: 1.5px solid #60a5fa;
  border-radius: 14px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
  &:hover:not(:disabled) {
    background: #f1f5fd;
    border-color: #2563eb;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.12);
  }
  &.correct {
    background: #d1fae5;
    border-color: #22c55e;
    color: #15803d;
  }
  &.incorrect {
    background: #fee2e2;
    border-color: #ef4444;
    color: #b91c1c;
  }
`;

const Score = styled.div`
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  color: #3b82f6;
  margin: 20px 0 0 0;
`;

const PersonalWork = () => {
  const [document, setDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const chatAreaRef = useRef(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      setDocument(file);
      setMessages([{
        id: 1,
        text: `Here's a summary of "${file.name}":\n\nThis document covers key concepts and provides detailed explanations. Would you like to know more about any specific aspect?`,
        isUser: false
      }]);
    }
  });

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !document) return;
    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      isUser: true
    };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: "I'm analyzing your question about the document. Here is a detailed response...",
        isUser: false
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleRemoveDocument = () => {
    setDocument(null);
    setMessages([]);
    setCurrentQuiz(null);
    setQuizScore(0);
    setQuizIndex(0);
  };

  const handleGenerateAudio = () => {
    setIsGeneratingAudio(true);
    setTimeout(() => {
      setIsGeneratingAudio(false);
      alert('Audio overview generated! (Simulated)');
    }, 2000);
  };

  const handleGenerateQuiz = () => {
    setIsGeneratingQuiz(true);
    setTimeout(() => {
      setCurrentQuiz({
        question: "What is the main topic discussed in the document?",
        options: [
          "Machine Learning",
          "Artificial Intelligence",
          "Deep Learning",
          "Neural Networks"
        ],
        correctAnswer: 1
      });
      setIsGeneratingQuiz(false);
      setQuizIndex(1);
      setQuizScore(0);
    }, 1000);
  };

  const handleAnswerQuiz = (selectedIndex) => {
    if (!currentQuiz || quizAnswered) return;
    setSelectedOption(selectedIndex);
    setQuizAnswered(true);
    const isCorrect = selectedIndex === currentQuiz.correctAnswer;
    if (isCorrect) setQuizScore(prev => prev + 1);
    setTimeout(() => {
      if (quizIndex < 10) {
        setCurrentQuiz({
          question: `Sample Question ${quizIndex + 1}?`,
          options: [
            "Option 1",
            "Option 2",
            "Option 3",
            "Option 4"
          ],
          correctAnswer: Math.floor(Math.random() * 4)
        });
        setQuizIndex(prev => prev + 1);
        setQuizAnswered(false);
        setSelectedOption(null);
      } else {
        setCurrentQuiz(null);
        setQuizCompleted(true);
        setQuizAnswered(false);
        setSelectedOption(null);
      }
    }, 1500);
  };

  const handleStartNewQuiz = () => {
    setQuizCompleted(false);
    setQuizScore(0);
    setQuizIndex(1);
    setCurrentQuiz({
      question: "What is the main topic discussed in the document?",
      options: [
        "Machine Learning",
        "Artificial Intelligence",
        "Deep Learning",
        "Neural Networks"
      ],
      correctAnswer: 1
    });
  };

  return (
    <GlassContainer>
      <ChatSection>
        {document ? (
          <>
            <DocumentStatus>
              <StatusText>
                <FaFileUpload />
                {document.name}
              </StatusText>
              <ActionButtons>
                <Button onClick={handleClearChat} title="Clear Chat"><FaBroom /></Button>
                <Button onClick={handleRemoveDocument} title="Remove Document"><FaTrash /></Button>
              </ActionButtons>
            </DocumentStatus>
            <ChatArea ref={chatAreaRef}>
              {messages.map(message => (
                <Message key={message.id} isUser={message.isUser}>
                  <Avatar isUser={message.isUser}>
                    {message.isUser ? <FaUserCircle /> : <FaRobot />}
                  </Avatar>
                  <MessageContent isUser={message.isUser}>{message.text}</MessageContent>
                </Message>
              ))}
            </ChatArea>
            <ChatInput>
              <Input
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Ask a question about the document..."
                disabled={!document}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} disabled={!document || !inputMessage.trim()}>Send</Button>
            </ChatInput>
          </>
        ) : (
          <UploadArea {...getRootProps()}>
            <input {...getInputProps()} />
            <FaFileUpload size={48} color="#3b82f6" />
            <h3 style={{margin: '16px 0 8px 0', color: '#3b82f6'}}>Upload a PDF or DOC file to start</h3>
            <p style={{color: '#64748b'}}>Drag and drop a file here, or click to select</p>
          </UploadArea>
        )}
      </ChatSection>
      <RightSection>
        <AudioSection>
          <h3 style={{marginBottom: 8, color: '#3b82f6'}}>Audio Overview</h3>
          <p style={{marginBottom: 16, color: '#64748b'}}>Generate a detailed audio explanation of the document</p>
          <Button
            onClick={handleGenerateAudio}
            disabled={!document || isGeneratingAudio}
          >
            {isGeneratingAudio ? 'Generating...' : (<><FaPlay /> Generate Audio Overview</>)}
          </Button>
          {document && (
            <Button
              onClick={() => alert('Audio download started (simulated)')}
              style={{ marginTop: '12px' }}
            >
              <FaDownload /> Download Audio
            </Button>
          )}
        </AudioSection>
        <QuizSection>
          <h3 style={{marginBottom: 8, color: '#3b82f6'}}>Quiz Generator</h3>
          <p style={{marginBottom: 16, color: '#64748b'}}>Test your understanding with AI-generated questions</p>
          <Button
            onClick={handleGenerateQuiz}
            disabled={!document || isGeneratingQuiz}
          >
            {isGeneratingQuiz ? 'Generating...' : (<><FaQuestionCircle /> Generate Quiz</>)}
          </Button>
          {currentQuiz && (
            <QuizQuestion>
              <QuestionText>{currentQuiz.question}</QuestionText>
              <Options>
                {currentQuiz.options.map((option, index) => {
                  let className = '';
                  if (quizAnswered) {
                    if (index === currentQuiz.correctAnswer) className = 'correct';
                    if (selectedOption === index && index !== currentQuiz.correctAnswer) className = 'incorrect';
                  }
                  return (
                    <Option
                      key={index}
                      className={className}
                      onClick={() => handleAnswerQuiz(index)}
                      disabled={quizAnswered}
                    >
                      {option}
                    </Option>
                  );
                })}
              </Options>
              <Score>Score: {quizScore}/10</Score>
            </QuizQuestion>
          )}
          {quizCompleted && !currentQuiz && (
            <QuizQuestion>
              <QuestionText>Quiz Completed!</QuestionText>
              <Score>Your Final Score: {quizScore}/10</Score>
              <Button onClick={handleStartNewQuiz} style={{marginTop: 16}}>Start New Quiz</Button>
            </QuizQuestion>
          )}
        </QuizSection>
      </RightSection>
    </GlassContainer>
  );
};

export default PersonalWork; 