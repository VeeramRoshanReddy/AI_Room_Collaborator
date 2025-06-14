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
  padding: 24px;
`;

const RightSection = styled.div`
  flex: 0 0 35%;
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-width: 0;
  height: 100%;
  padding: 24px;
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
  max-width: 700px;
  align-self: center;
  width: 100%;
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

const AudioPlayerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  width: 100%;
`;

const AudioProgressBar = styled.div`
  height: 8px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
`;

const AudioProgress = styled.div`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 4px;
`;

const AudioControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const PlaybackButton = styled.button`
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  transition: transform 0.1s, box-shadow 0.2s;
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
  }
  &:active {
    transform: scale(0.95);
  }
`;

const TimeDisplay = styled.span`
  font-size: 14px;
  color: #4b5563;
  font-weight: 500;
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const VolumeSlider = styled.input`
  width: 80px;
  -webkit-appearance: none;
  height: 6px;
  background: #e0e7ef;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }
`;

const PlaybackSpeedControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SpeedButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' : '#e0e7ef'};
  color: ${props => props.active ? 'white' : '#3b82f6'};
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    opacity: ${props => props.active ? 1 : 0.8};
    box-shadow: ${props => props.active ? '0 2px 8px rgba(59, 130, 246, 0.2)' : 'none'};
  }
`;

const SkipButton = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.1s;
  &:hover {
    transform: scale(1.1);
  }
  &:active {
    transform: scale(0.9);
  }
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
  const [quizStarted, setQuizStarted] = useState(false);
  const [audioGenerated, setAudioGenerated] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);
  const chatAreaRef = useRef(null);
  const [isAudioDownloading, setIsAudioDownloading] = useState(false);

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
    setQuizStarted(false);
    setQuizCompleted(false);
    setAudioGenerated(false);
    setIsPlayingAudio(false);
    setAudioCurrentTime(0);
    setIsAudioDownloading(false);
  };

  const handleGenerateAudio = () => {
    setIsGeneratingAudio(true);
    setAudioGenerated(false);
    setIsAudioDownloading(false);
    setTimeout(() => {
      setIsGeneratingAudio(false);
      setAudioGenerated(true);
      setAudioDuration(180);
    }, 2000);
  };

  const handleTogglePlayPause = () => {
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlayingAudio(true);
    } else {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  const handleSeek = (e) => {
    const seekTime = (e.nativeEvent.offsetX / e.target.offsetWidth) * audioDuration;
    audioRef.current.currentTime = seekTime;
    setAudioCurrentTime(seekTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    audioRef.current.volume = newVolume;
    setAudioVolume(newVolume);
  };

  const handlePlaybackSpeedChange = (speed) => {
    audioRef.current.playbackRate = speed;
    setAudioPlaybackSpeed(speed);
  };

  const handleSkip = (seconds) => {
    audioRef.current.currentTime += seconds;
    setAudioCurrentTime(audioRef.current.currentTime);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', () => {
        setAudioCurrentTime(audioRef.current.currentTime);
      });
      audioRef.current.addEventListener('loadedmetadata', () => {
        setAudioDuration(audioRef.current.duration);
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlayingAudio(false);
        setAudioCurrentTime(0);
      });
    }
  }, []);

  const handleGenerateQuiz = () => {
    setIsGeneratingQuiz(true);
    setQuizStarted(true);
    setQuizCompleted(false);
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
    setQuizStarted(true);
    setCurrentQuiz({
      question: "What is the main topic discussed in the document? (New Quiz)",
      options: [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      correctAnswer: 0
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
          {!audioGenerated && !isGeneratingAudio && (
            <Button
              onClick={handleGenerateAudio}
              disabled={!document}
            >
              <FaPlay /> Generate Audio Overview
            </Button>
          )}
          {isGeneratingAudio && (
            <p style={{color: '#64748b', textAlign: 'center', marginTop: '10px'}}>Generating audio, wait...</p>
          )}
          {audioGenerated && (
            <AudioPlayerContainer>
              <audio ref={audioRef} src="/path/to/your/simulated-audio.mp3" preload="metadata" />
              <AudioProgressBar onClick={handleSeek}>
                <AudioProgress progress={(audioCurrentTime / audioDuration) * 100} />
              </AudioProgressBar>
              <AudioControls>
                <SkipButton onClick={() => handleSkip(-10)}>&#171; 10s</SkipButton>
                <PlaybackButton onClick={handleTogglePlayPause}>
                  {isPlayingAudio ? <FaPlay /> : <FaPlay />}
                </PlaybackButton>
                <SkipButton onClick={() => handleSkip(10)}>10s &#187;</SkipButton>
                <TimeDisplay>{formatTime(audioCurrentTime)} / {formatTime(audioDuration)}</TimeDisplay>
                <VolumeControl>
                  <FaPlay size={16} color="#4b5563" />
                  <VolumeSlider
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={audioVolume}
                    onChange={handleVolumeChange}
                  />
                </VolumeControl>
                <PlaybackSpeedControl>
                  {[0.5, 0.8, 1.0, 1.2, 1.5, 1.8, 2.0].map(speed => (
                    <SpeedButton
                      key={speed}
                      active={audioPlaybackSpeed === speed}
                      onClick={() => handlePlaybackSpeedChange(speed)}
                    >
                      {speed.toFixed(1)}x
                    </SpeedButton>
                  ))}
                </PlaybackSpeedControl>
              </AudioControls>
              <Button
                onClick={() => {
                  setIsAudioDownloading(true);
                  setTimeout(() => {
                    alert('Audio download started (simulated)');
                    setIsAudioDownloading(false);
                  }, 1000);
                }}
                style={{ marginTop: '12px' }}
              >
                <FaDownload /> {isAudioDownloading ? 'Downloading...' : 'Download Audio'}
              </Button>
            </AudioPlayerContainer>
          )}
        </AudioSection>
        <QuizSection>
          <h3 style={{marginBottom: 8, color: '#3b82f6'}}>Quiz Generator</h3>
          <p style={{marginBottom: 16, color: '#64748b'}}>Test your understanding with AI-generated questions</p>
          {!quizStarted && !isGeneratingQuiz && (
            <Button
              onClick={handleGenerateQuiz}
              disabled={!document}
            >
              <FaQuestionCircle /> Generate Quiz
            </Button>
          )}
          {isGeneratingQuiz && (
            <p style={{color: '#64748b', textAlign: 'center'}}>Generating quiz...</p>
          )}
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
              <Score>Final Score: {quizScore}/10</Score>
              <Button onClick={handleStartNewQuiz} style={{ marginTop: '20px' }}>
                Regenerate Quiz
              </Button>
            </QuizQuestion>
          )}
        </QuizSection>
      </RightSection>
    </GlassContainer>
  );
};

export default PersonalWork; 