import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaFileUpload, FaRobot, FaUserCircle, FaTrash, FaBroom, FaPlay, FaDownload, FaQuestionCircle, FaPlus, FaTimes, FaEllipsisV, FaChevronLeft, FaPause, FaVolumeUp, FaFileAlt, FaEdit, FaEye } from 'react-icons/fa';
import { useUserContext } from '../../context/UserContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NoteChat from './NoteChat';

const GlassContainer = styled.div`
  display: flex;
  gap: 16px;
  height: calc(100vh - 80px); // Changed to match container height
  min-height: 0;
  font-family: 'Poppins', 'Inter', 'Montserrat', sans-serif;
  overflow: hidden;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(8px) saturate(1.2);
  margin-top: 8px;
`;

const ChatSection = styled.div`
  flex: 0 0 70%;
  display: flex;
  flex-direction: column;
  background: rgba(255,255,255,0.7);
  border-radius: 0 24px 24px 24px;
  border-top-left-radius: 0;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.12);
  overflow: hidden;
  min-width: 500px; // Add minimum width to prevent shrinking
  height: 100%;
  transition: box-shadow 0.2s;
  padding: 16px;
`;

const RightSection = styled.div`
  flex: 0 0 30%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  height: 100%;
  padding: 0;
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
  min-height: 0;
  overflow: visible;
  position: relative;
  padding: 8px; // Reduced from 12px
`;

const QuizSection = styled(GlassBox)`
  flex: 0 0 70%;
  min-height: 0;
  overflow: hidden;
  padding: 8px; // Reduced from 12px
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
  width: 100%; // Changed from max-width: 700px to full width
  height: 100%; // Add full height
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
  padding: 16px;
  overflow-y: auto; // Changed from hidden to auto
  background: transparent;
  min-width: 0; // Add this for proper text wrapping
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
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%); // Changed from #3b82f6 to #2563eb for darker blue
  color: white;
  border: none;
  border-radius: 16px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.10); // Updated shadow color
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  &:hover {
    background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%); // Updated hover colors
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.18); // Updated shadow color
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
  word-wrap: break-word; // Add this
  word-break: break-word; // Add this
  white-space: pre-wrap; // Add this to preserve line breaks
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

const CompactAudioPlayerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

const CompactAudioProgressBar = styled.div`
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
`;

const CompactAudioProgress = styled.div`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 2px;
`;

const AudioMainControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  position: relative;
`;

const PlayPauseButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #2563eb;
    transform: scale(1.05);
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

const CompactVolumeSlider = styled.input`
  width: 60px;
  height: 3px;
  background: #e2e8f0;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #f1f5f9;
    color: #3b82f6;
    border-color: #3b82f6;
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
  font-size: 1.3rem;
  font-weight: 700;
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

const EnterNoteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: #4F46E5;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;
  width: 70%;
  align-self: center;
  
  &:hover {
    background: #4338CA;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 40px;
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
  width: 100%;
  text-align: center;
  h2 {
    font-size: 32px; // Increased from 24px
    font-weight: 700;
    color: #2563eb;
    flex: 1;
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
  position: absolute;
  top: 16px;
  right: 16px;
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
  font-weight: 900;
  font-size: 16px;

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
  height: calc(100vh - 20px); // Changed from 100% to extend more
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
  margin: 10px 0; // Add margin for spacing from top/bottom
`;

const NotesView = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;
  overflow-y: auto;
  background: #f8fafc;
  height: calc(100vh - 48px); // Add explicit height
`;

const NotesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); // 0.75x of 280px
  gap: 24px;
  padding: 24px;
  overflow-y: hidden;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  justify-content: center;
  justify-items: center;
`;

const NoteCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.10);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  width: 100%;
  max-width: 230px;

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
  gap: 16px;
  background: #f8fafc;
  overflow: hidden;
  position: relative;
  height: calc(100vh - 48px); // Add explicit height
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  border: none;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);

  &:hover {
    background: #1d4ed8;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 2px;
  font-size: 14px;
  &:hover {
    color: #3b82f6;
  }
`;

const AudioDropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 4px;
  z-index: 1000;
  min-width: 140px;
  border: 1px solid #e2e8f0;
`;

const AudioMenuItem = styled.div`
  padding: 10px 18px;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  &:hover {
    background: #f1f5fd;
  }
  &.delete {
    color: #ef4444;
  }
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  &:hover {
    background-color: #f3f4f6;
  }
`;

const CompactSectionTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  h2 {
    font-size: 16px;
    font-weight: 700;
    color: #2563eb;
  }
`;

const CompactText = styled.p`
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.3;
`;

const CompactButton = styled(Button)`
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 8px;
`;

const CompactAudioControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
`;

const AudioSkipControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const CompactPlaybackButton = styled.button`
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  transition: transform 0.1s, box-shadow 0.2s;
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
  }
`;

const TimeInfo = styled.div`
  font-size: 10px;
  color: #64748b;
  text-align: center;
  font-weight: 500;
`;

const SpeedSubmenu = styled.div`
  position: absolute;
  top: 0;
  left: -140px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 4px;
  min-width: 80px;
  border: 1px solid #e2e8f0;
`;

const PersonalWork = () => {
  const { user, session, makeAuthenticatedRequest, isAuthenticated } = useUserContext();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [audioData, setAudioData] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedDocument, setUploadedDocument] = useState(null);
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
  const [showCreateNoteForm, setShowCreateNoteForm] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteDescription, setNewNoteDescription] = useState('');
  const [showNoteMenu, setShowNoteMenu] = useState(null);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Loading states for specific operations
  const [uploadingFile, setUploadingFile] = useState(false);
  const [creatingNote, setCreatingNote] = useState(false);
  const [deletingNote, setDeletingNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [fetchingNotes, setFetchingNotes] = useState(false);

  const audio = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user) fetchNotes();
  }, [isAuthenticated, user]);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await makeAuthenticatedRequest('/notes/my-notes');

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch notes:", errorText);
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      const errorMessage = err.message || 'Error fetching notes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    setError(null);
    // Optimistic update
    const optimisticDocument = {
      id: `temp_${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading'
    };
    setUploadedDocument(optimisticDocument);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await makeAuthenticatedRequest('/notes/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to upload file');
      }
      const data = await res.json();
      setUploadedDocument({
        id: data.note_id,
        name: file.name,
        status: 'uploaded',
      });
      toast.success('Document uploaded successfully!');
      // Fetch chat history for this note
      fetchChatHistory(data.note_id);
    } catch (err) {
      setUploadedDocument(null);
      const errorMessage = err.message || 'Error uploading file';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSendMessage = async (question) => {
    if (!question.trim() || !uploadedDocument) return;
    setSendingMessage(true);
    setError(null);
    const optimisticMessage = {
      id: Date.now(),
      text: question,
      isUser: true,
      sender: user?.name,
      time: new Date().toLocaleTimeString()
    };
    const originalMessages = [...messages];
    setMessages(prev => [...prev, optimisticMessage]);
    try {
      const res = await makeAuthenticatedRequest('/notes/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note_id: uploadedDocument.id,
          question: question
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to get response');
      }
      const data = await res.json();
      const aiMessage = {
        id: Date.now() + 1,
        text: data.answer,
        isUser: false,
        sender: 'AI',
        time: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, aiMessage]);
      setInputMessage('');
      // Optionally, fetch chat history again
      fetchChatHistory(uploadedDocument.id);
    } catch (err) {
      setMessages(originalMessages);
      const errorMessage = err.message || 'Error sending message';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!uploadedDocument) {
      toast.error('Please upload a document first');
      return;
    }

    setGeneratingAudio(true);
    setError(null);

    try {
      const res = await makeAuthenticatedRequest('/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: uploadedDocument.id,
          text: "Generate audio summary of the uploaded document"
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate audio');
      }

      const data = await res.json();
      setAudioGenerated(true);
      toast.success('Audio generated successfully!');

    } catch (err) {
      const errorMessage = err.message || 'Error generating audio';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setGeneratingAudio(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!uploadedDocument) {
      toast.error('Please upload a document first');
      return;
    }

    setGeneratingQuiz(true);
    setError(null);

    try {
      const res = await makeAuthenticatedRequest('/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: uploadedDocument.id,
          difficulty: 'medium',
          num_questions: 5
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate quiz');
      }

      const data = await res.json();
      setCurrentQuiz(data.quiz);
      setQuizStarted(true);
      setQuizIndex(0);
      setQuizScore(0);
      setQuizCompleted(false);
      toast.success('Quiz generated successfully!');

    } catch (err) {
      const errorMessage = err.message || 'Error generating quiz';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    setDeletingNote(true);
    setError(null);

    // Optimistic update
    const originalNotes = [...notes];
    setNotes(prev => prev.filter(note => note.id !== id));

    try {
      const res = await makeAuthenticatedRequest(`/notes/note/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete note');
      }

      toast.success('Note deleted successfully');

    } catch (err) {
      // Rollback optimistic update
      setNotes(originalNotes);
      const errorMessage = err.message || 'Error deleting note';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeletingNote(false);
    }
  };

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (audioRef.current && audioGenerated) {
      const audio = audioRef.current;
      
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
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioGenerated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check for audio menu
      if (showAudioMenu && !event.target.closest('[data-audio-menu]')) {
        setShowAudioMenu(false);
        setShowSpeedMenu(false);
      }
      // Check for note menu
      if (showNoteMenu && !event.target.closest(`#note-three-dots-${showNoteMenu}`) && !event.target.closest(`#note-menu-${showNoteMenu}`)) {
        setShowNoteMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAudioMenu, showNoteMenu]);

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

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) {
      toast.error('Note title is required');
      return;
    }

    setCreatingNote(true);
    setError(null);

    // Optimistic update
    const optimisticNote = {
      id: `temp_${Date.now()}`,
      title: newNoteTitle,
      description: newNoteDescription,
      created_at: new Date().toISOString(),
      date: new Date().toLocaleDateString()
    };

    const originalNotes = [...notes];
    setNotes(prev => [optimisticNote, ...prev]);

    try {
      const res = await makeAuthenticatedRequest('/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newNoteTitle,
          description: newNoteDescription
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create note');
      }

      const data = await res.json();
      
      // Replace optimistic note with real note
      setNotes(prev => prev.map(note => 
        note.id === optimisticNote.id ? {
          ...note,
          id: data.note._id || data.note.id
        } : note
      ));

      setShowCreateNoteForm(false);
      setNewNoteTitle('');
      setNewNoteDescription('');
      toast.success('Note created successfully!');

    } catch (err) {
      // Rollback optimistic update
      setNotes(originalNotes);
      const errorMessage = err.message || 'Error creating note';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCreatingNote(false);
    }
  };

  const handleBackToNotes = () => {
    setSelectedNote(null);
    setUploadedDocument(null);
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

  const handleAudioMenuClick = () => {
    setShowAudioMenu(!showAudioMenu);
  };

  const handleDownloadAudio = () => {
    setIsAudioDownloading(true);
    setTimeout(() => {
      alert('Audio download started (simulated)');
      setIsAudioDownloading(false);
    }, 1000);
  };

  const fetchChatHistory = async (noteId) => {
    try {
      const res = await makeAuthenticatedRequest(`/notes/${noteId}/chat-history`, {
        method: 'GET',
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map(log => ({
          id: log.id,
          text: `${log.question}\n\n${log.answer}`,
          isUser: false,
          sender: 'AI',
          time: log.created_at ? new Date(log.created_at).toLocaleTimeString() : ''
        })));
      }
    } catch (err) {
      // Ignore chat history errors for now
    }
  };

  if (!isAuthenticated) {
    return <div style={{textAlign:'center',marginTop:'40px'}}><h2>Please log in to access your personal work.</h2></div>;
  }

  return (
    <>
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.6)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div className="spinner" style={{ width: 60, height: 60, border: '6px solid #3b82f6', borderTop: '6px solid #e0e7ef', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      {showCreateNoteForm && (
        <FormOverlay onClick={() => setShowCreateNoteForm(false)}>
          <FormBox onClick={e => e.stopPropagation()}>
            <FormTitle>Create New Note</FormTitle>
            <FormInput
              placeholder="Note Title"
              value={newNoteTitle}
              onChange={e => setNewNoteTitle(e.target.value)}
            />
            <textarea
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e7ef',
                borderRadius: '8px',
                fontSize: '1rem',
                color: '#1e293b',
                minHeight: '100px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder="Note Description (Optional)"
              value={newNoteDescription}
              onChange={e => setNewNoteDescription(e.target.value)}
            />
            <FormButton onClick={handleCreateNote}>Create Note</FormButton>
          </FormBox>
        </FormOverlay>
      )}
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
                  <NoteCard key={note.id}>
                    <NoteTitle>{note.title}</NoteTitle>
                    <NoteDescription>{note.description}</NoteDescription>
                    <NoteDate>Created on: {note.created_at ? note.created_at.slice(0, 10) : note.date}</NoteDate>
                    <EnterNoteButton onClick={() => setSelectedNote(note)}>
                      Enter Note
                    </EnterNoteButton>
                    <NoteActions>
                      <ThreeDotsButton
                        id={`note-three-dots-${note.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowNoteMenu(note.id);
                        }}
                      >
                        <FaEllipsisV />
                      </ThreeDotsButton>
                      {showNoteMenu === note.id && (
                        <DropdownMenu id={`note-menu-${note.id}`}>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            style={{ whiteSpace: 'nowrap' }}
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
          </NotesView>
        ) : (
          <DocumentView>
            {/* ...existing DocumentView code... */}
          </DocumentView>
        )}
      </PersonalWorkContainer>
      <NoteChat />
    </>
  );
}

export default PersonalWork;