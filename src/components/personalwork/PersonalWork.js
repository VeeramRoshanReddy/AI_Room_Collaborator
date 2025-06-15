import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { FaFileUpload, FaRobot, FaUserCircle, FaTrash, FaBroom, FaPlay, FaDownload, FaQuestionCircle, FaPlus, FaTimes, FaEllipsisV, FaChevronLeft, FaPause } from 'react-icons/fa';

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

const ChatInputArea = styled.div`
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

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OptionButton = styled.button`
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

const MainArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
  min-height: 0;
  padding: 24px;
  overflow-y: auto;
`;

const SectionsContainer = styled.div`
  display: flex;
  gap: 24px;
  height: 100%;
  min-height: 0;
`;

const NotesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
  min-height: 0;
  padding: 24px;
  background: rgba(255,255,255,0.7);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.12);
`;

const SectionTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  h2 {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
  }
`;

const NoteCreationForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: rgba(255,255,255,0.8);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08);

  input, textarea {
    width: 100%;
    padding: 12px 16px;
    border: 1.5px solid #e0e7ef;
    border-radius: 12px;
    font-size: 15px;
    background: white;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }
`;

const NoteList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
`;

const NoteActions = styled.div`
  position: relative;
`;

const NoteMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 8px;
  z-index: 100;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #fee2e2;
  }
`;

const ThreeDotsButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;

  &:hover {
    color: #1e293b;
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const QuizResult = styled.div`
  padding: 24px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08);

  h4 {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 12px;
  }

  p {
    font-size: 16px;
    color: #64748b;
    margin-bottom: 20px;
  }
`;

const FormButton = styled(Button)`
  margin-top: 16px;
  align-self: flex-end;
`;

const PersonalWorkContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
`;

const NotesView = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;
  overflow-y: auto;
  background: #f8fafc;
`;

const NotesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
  overflow-y: auto;
`;

const NoteCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.10);
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(37, 99, 235, 0.15);
  }
`;

const DocumentView = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;
  background: #f8fafc;
  overflow: hidden;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: none;
  border: none;
  color: #2563eb;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #1d4ed8;
  }
`;

const PersonalWork = () => {
  const [selectedNote, setSelectedNote] = useState(null);
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
  const [notes, setNotes] = useState([
    { id: 1, title: 'Meeting Notes', description: 'Summary of project meeting', date: '2024-07-20' },
    { id: 2, title: 'Research Ideas', description: 'Brainstorming for new AI models', date: '2024-07-19' },
  ]);
  const [showCreateNoteForm, setShowCreateNoteForm] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteDescription, setNewNoteDescription] = useState('');
  const [showNoteMenu, setShowNoteMenu] = useState(null);

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
      setMessages([
        {
          id: 1,
          text: `Here's a summary of "${file.name}":

This document covers key concepts and provides detailed explanations. Would you like to know more about any specific aspect?`,
          isUser: false
        }
      ]);
    }
  });

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (audioRef.current && audioGenerated) {
      const audio = audioRef.current;
      console.log('useEffect ran: audioRef.current is', audioRef.current);
      console.log('useEffect ran: audio (captured) is', audio);
      
      const handleTimeUpdate = () => setAudioCurrentTime(audio.currentTime);
      const handleLoadedMetadata = () => setAudioDuration(audio.duration);
      const handleEnded = () => {
        setIsPlayingAudio(false);
        setAudioCurrentTime(0);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);

      return () => {
        console.log('Cleanup function running');
        console.log('Cleanup: audioRef.current is', audioRef.current);
        console.log('Cleanup: audio (captured) is', audio);
        if (audio) {
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [audioRef.current, audioGenerated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNoteMenu && !event.target.closest('#note-menu-' + showNoteMenu) && !event.target.closest('#note-three-dots-' + showNoteMenu)) {
        setShowNoteMenu(null);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
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
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlayingAudio(true);
    } else {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const seekTime = (e.nativeEvent.offsetX / e.target.offsetWidth) * audioDuration;
    audioRef.current.currentTime = seekTime;
    setAudioCurrentTime(seekTime);
  };

  const handleVolumeChange = (e) => {
    if (!audioRef.current) return;
    const newVolume = parseFloat(e.target.value);
    audioRef.current.volume = newVolume;
    setAudioVolume(newVolume);
  };

  const handlePlaybackSpeedChange = (speed) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = speed;
    setAudioPlaybackSpeed(speed);
  };

  const handleSkip = (seconds) => {
    if (!audioRef.current) return;
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
    setShowNoteMenu(null);
  };

  const handleResetAll = () => {
    setMessages([]);
    setDocument(null);
    setCurrentQuiz(null);
    setQuizScore(0);
    setQuizIndex(0);
    setQuizStarted(false);
    setQuizCompleted(false);
    setQuizAnswered(false);
    setSelectedOption(null);
    setAudioGenerated(false);
    setIsPlayingAudio(false);
    setAudioCurrentTime(0);
    setIsAudioDownloading(false);
  };

  const handleNoteClick = (note) => {
    setSelectedNote(note);
  };

  const handleBackToNotes = () => {
    setSelectedNote(null);
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
  };

  return (
    <PersonalWorkContainer>
      {!selectedNote ? (
        <NotesView>
          <SectionTitle>
            <h2>Personal Notes</h2>
            <Button onClick={() => setShowCreateNoteForm(true)}>
              <FaPlus /> Create New Note
            </Button>
          </SectionTitle>
          
          <NotesGrid>
            {notes.length === 0 ? (
              <p style={{textAlign: 'center', color: '#64748b'}}>No notes yet. Create your first note!</p>
            ) : (
              notes.map(note => (
                <NoteCard key={note.id} onClick={() => handleNoteClick(note)}>
                  <NoteTitle>{note.title}</NoteTitle>
                  <NoteDescription>{note.description}</NoteDescription>
                  <NoteDate>Created on: {note.date}</NoteDate>
                  <NoteActions>
                    <ThreeDotsButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNoteMenu(note.id);
                      }}
                    >
                      <FaEllipsisV />
                    </ThreeDotsButton>
                    {showNoteMenu === note.id && (
                      <DropdownMenu>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                        >
                          <FaTrash /> Delete Note
                        </DropdownMenuItem>
                      </DropdownMenu>
                    )}
                  </NoteActions>
                </NoteCard>
              ))
            )}
          </NotesGrid>

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
                  as="textarea"
                  placeholder="Note Description (Optional)"
                  value={newNoteDescription}
                  onChange={e => setNewNoteDescription(e.target.value)}
                />
                <FormButton onClick={handleCreateNote}>Create Note</FormButton>
              </FormBox>
            </FormOverlay>
          )}
        </NotesView>
      ) : (
        <DocumentView>
          <BackButton onClick={handleBackToNotes}>
            <FaChevronLeft /> Back to Notes
          </BackButton>
          
          <GlassContainer>
            <SectionsContainer>
              <ChatSection>
                {document ? (
                  <>
                    <DocumentStatus>
                      <StatusText>
                        <FaFileUpload />
                        {document.name}
                      </StatusText>
                      <ActionButtons>
                        <Button onClick={handleClearChat} title="Clear Chat">
                          <FaBroom />
                        </Button>
                        <Button onClick={handleRemoveDocument} title="Remove Document">
                          <FaTrash />
                        </Button>
                      </ActionButtons>
                    </DocumentStatus>
                    <ChatArea ref={chatAreaRef}>
                      {messages.map(message => (
                        <Message key={message.id} isUser={message.isUser}>
                          <Avatar isUser={message.isUser}>
                            {message.isUser ? <FaUserCircle /> : <FaRobot />}
                          </Avatar>
                          <MessageContent isUser={message.isUser}>
                            {message.text}
                          </MessageContent>
                        </Message>
                      ))}
                    </ChatArea>
                    <ChatInputArea>
                      <Input
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        placeholder="Ask a question about the document..."
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim()}
                      >
                        Send
                      </Button>
                    </ChatInputArea>
                  </>
                ) : (
                  <UploadArea {...getRootProps()}>
                    <input {...getInputProps()} />
                    <FaFileUpload size={48} color="#3b82f6" />
                    <h3 style={{margin: '16px 0 8px 0', color: '#3b82f6'}}>
                      Upload a PDF or DOC file to start
                    </h3>
                    <p style={{color: '#64748b'}}>
                      Drag and drop a file here, or click to select
                    </p>
                  </UploadArea>
                )}
              </ChatSection>

              <RightSection>
                <AudioSection>
                  <SectionTitle>
                    <h2>Audio Overview</h2>
                  </SectionTitle>
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
                      <audio
                        ref={audioRef}
                        src="/path/to/your/simulated-audio.mp3"
                        preload="metadata"
                      />
                      <AudioProgressBar onClick={handleSeek}>
                        <AudioProgress progress={(audioCurrentTime / audioDuration) * 100} />
                      </AudioProgressBar>
                      <AudioControls>
                        <SkipButton onClick={() => handleSkip(-10)}>&#171; 10s</SkipButton>
                        <PlaybackButton onClick={handleTogglePlayPause}>
                          {isPlayingAudio ? <FaPause /> : <FaPlay />}
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
                  <SectionTitle>
                    <h2>Quiz Generator</h2>
                  </SectionTitle>
                  <p style={{marginBottom: 16, color: '#64748b'}}>
                    Test your understanding with AI-generated questions
                  </p>
                  
                  {!quizStarted && !isGeneratingQuiz && (
                    <Button
                      onClick={handleGenerateQuiz}
                      disabled={!document}
                    >
                      <FaQuestionCircle /> Generate Quiz
                    </Button>
                  )}

                  {isGeneratingQuiz && (
                    <p style={{color: '#64748b', textAlign: 'center'}}>
                      Generating quiz...
                    </p>
                  )}

                  {currentQuiz && !quizCompleted && (
                    <QuizQuestion>
                      <QuestionText>{currentQuiz.question}</QuestionText>
                      <OptionsContainer>
                        {currentQuiz.options.map((option, index) => {
                          let className = '';
                          if (quizAnswered) {
                            if (index === currentQuiz.correctAnswer) className = 'correct';
                            if (selectedOption === index && index !== currentQuiz.correctAnswer) className = 'incorrect';
                          }
                          return (
                            <OptionButton
                              key={index}
                              className={className}
                              onClick={() => handleAnswerQuiz(index)}
                              disabled={quizAnswered}
                            >
                              {option}
                            </OptionButton>
                          );
                        })}
                      </OptionsContainer>
                      <Score>Score: {quizScore}/10</Score>
                    </QuizQuestion>
                  )}

                  {quizCompleted && (
                    <QuizResult>
                      <h4>Quiz Completed!</h4>
                      <p>Great job! You've completed the quiz.</p>
                      <Score>Final Score: {quizScore}/10</Score>
                      <Button onClick={handleStartNewQuiz} style={{marginTop: '20px'}}>
                        Start New Quiz
                      </Button>
                    </QuizResult>
                  )}
                </QuizSection>
              </RightSection>
            </SectionsContainer>
          </GlassContainer>
        </DocumentView>
      )}
    </PersonalWorkContainer>
  );
};

export default PersonalWork; 