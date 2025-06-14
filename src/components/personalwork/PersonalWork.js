import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { FaFileUpload, FaRobot, FaUserCircle, FaTrash, FaBroom, FaPlay, FaDownload, FaQuestionCircle, FaPlus, FaTimes, FaEllipsisV } from 'react-icons/fa';

const GlassContainer = styled.div`
  display: flex;
  gap: 32px;
  height: 100%;
  min-height: 0;
  font-family: 'Poppins', 'Inter', 'Montserrat', sans-serif;
  overflow-y: auto;
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
  flex: 0 0 25%;
  height: 20%;
  min-height: 150px;
`;

const QuizSection = styled(GlassBox)`
  flex: 0 0 75%;
  height: 80%;
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

const NoteContainer = styled(GlassBox)`
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
`;

const NoteItem = styled.div`
  background: rgba(255,255,255,0.8);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.08);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NoteTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
`;

const NoteDescription = styled.p`
  font-size: 0.9rem;
  color: #4b5563;
`;

const NoteDate = styled.span`
  font-size: 0.8rem;
  color: #64748b;
`;

const AddNoteButton = styled(Button)`
  margin-top: 20px;
  align-self: center;
  width: fit-content;
`;

const FormOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const FormBox = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
`;

const FormTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e7ef;
  border-radius: 8px;
  font-size: 1rem;
  color: #1e293b;
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const FormButton = styled.button`
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
  }
`;

const ThreeDotsIcon = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  cursor: pointer;
  font-size: 1.2rem;
  color: #64748b;
  &:hover {
    color: #1d4ed8;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 40px; /* Adjust based on icon position */
  right: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.18);
  padding: 8px 0;
  min-width: 120px;
  z-index: 100;
`;

const DropdownMenuItem = styled.div`
  padding: 10px 18px;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #f1f5fd;
  }
  &.delete {
    color: #ef4444;
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
  const [quizStarted, setQuizStarted] = useState(false); // New state to track if quiz has been started
  const [audioGenerated, setAudioGenerated] = useState(false); // New state for audio generation
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState(1);
  const audioRef = useRef(null); // Ref for the audio element
  const chatAreaRef = useRef(null);
  const [isAudioDownloading, setIsAudioDownloading] = useState(false); // New state for download status
  const [personalWorkView, setPersonalWorkView] = useState('main'); // Temporarily changed to 'main' for debugging
  const [notes, setNotes] = useState([
    { id: 1, title: 'Meeting Notes', description: 'Summary of project meeting', date: '2024-07-20' },
    { id: 2, title: 'Research Ideas', description: 'Brainstorming for new AI models', date: '2024-07-19' },
  ]);
  const [showCreateNoteForm, setShowCreateNoteForm] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteDescription, setNewNoteDescription] = useState('');
  const [showNoteMenu, setShowNoteMenu] = useState(null); // New state to control note menu visibility

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

  useEffect(() => {
    // Close note menu when clicking outside
    const handleClickOutside = (event) => {
      if (showNoteMenu && !event.target.closest('#note-menu-' + showNoteMenu) && !event.target.closest('#note-three-dots-' + showNoteMenu)) {
        setShowNoteMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNoteMenu]);

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
    setQuizStarted(false); // Reset quiz state on document removal
    setQuizCompleted(false); // Reset quiz completed state
    setAudioGenerated(false); // Reset audio state
    setIsPlayingAudio(false); // Reset audio playback
    setAudioCurrentTime(0); // Reset audio current time
    setIsAudioDownloading(false); // Reset audio download status
  };

  const handleGenerateAudio = () => {
    setIsGeneratingAudio(true);
    setAudioGenerated(false); // Audio is not yet generated
    setIsAudioDownloading(false); // Reset download status when generating new audio
    setTimeout(() => {
      setIsGeneratingAudio(false);
      setAudioGenerated(true);
      setAudioDuration(180); // Simulate 3 minutes audio
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

  const handleCreateNote = () => {
    if (!newNoteTitle.trim()) return;
    const newNote = {
      id: notes.length + 1,
      title: newNoteTitle,
      description: newNoteDescription,
      date: new Date().toISOString().slice(0, 10)
    };
    setNotes(prev => [...prev, newNote]);
    setNewNoteTitle('');
    setNewNoteDescription('');
    setShowCreateNoteForm(false);
  };

  const handleDeleteNote = (id) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  return (
    <GlassContainer>
      <h1>TEST PERSONAL WORK COMPONENT</h1>
      {personalWorkView === 'notes' ? (
        <NoteContainer>
          <h3 style={{marginBottom: 8, color: '#3b82f6'}}>Your Notes</h3>
          {notes.length === 0 ? (
            <p style={{textAlign: 'center', color: '#64748b'}}>No notes yet. Create your first note!</p>
          ) : (
            notes.map(note => (
              <NoteItem key={note.id}>
                <ThreeDotsIcon id={`note-three-dots-${note.id}`} onClick={(e) => { e.stopPropagation(); setShowNoteMenu(note.id); }} />
                {showNoteMenu === note.id && (
                  <DropdownMenu id={`note-menu-${note.id}`}>
                    <DropdownMenuItem className="delete" onClick={() => { handleDeleteNote(note.id); setShowNoteMenu(null); }}><FaTrash /> Delete Note</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowNoteMenu(null)}><FaTimes /> Cancel</DropdownMenuItem>
                  </DropdownMenu>
                )}
                <NoteTitle>{note.title}</NoteTitle>
                <NoteDescription>{note.description}</NoteDescription>
                <NoteDate>Created on: {note.date}</NoteDate>
              </NoteItem>
            ))
          )}
          <AddNoteButton onClick={() => setShowCreateNoteForm(true)}><FaPlus /> Create New Note</AddNoteButton>

          {showCreateNoteForm && (
            <FormOverlay onClick={() => setShowCreateNoteForm(false)}>
              <FormBox onClick={e => e.stopPropagation()}>
                <FormTitle>Create New Note</FormTitle>
                <FormInput
                  placeholder="Note Title"
                  value={newNoteTitle}
                  onChange={e => setNewNoteTitle(e.target.value)}
                />
                <FormInput
                  placeholder="Note Description (Optional)"
                  value={newNoteDescription}
                  onChange={e => setNewNoteDescription(e.target.value)}
                />
                <FormButton onClick={handleCreateNote}>Create Note</FormButton>
              </FormBox>
            </FormOverlay>
          )}

          <Button onClick={() => setPersonalWorkView('main')} style={{marginTop: 'auto', alignSelf: 'center'}}>Enter Personal Work</Button>
        </NoteContainer>
      ) : (
        <>
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
        </>
      )}
    </GlassContainer>
  );
};

export default PersonalWork; 