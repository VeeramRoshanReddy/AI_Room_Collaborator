import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaPlus, FaSignInAlt, FaClock, FaChevronRight, FaChevronLeft, FaEllipsisV, FaTrash, FaUser, FaCrown, FaUserShield, FaTimes, FaLock, FaUnlock, FaEdit, FaCog, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context/UserContext';
import { toast } from 'react-toastify';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  height: 100%;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2);
  }
`;

const RoomsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  flex: 1;
  overflow-y: auto;
`;

const RoomCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  cursor: pointer;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const RoomTitle = styled.h3`
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
`;

const RoomStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: ${props => props.isPrivate ? '#ef4444' : '#10b981'};
`;

const RoomDescription = styled.p`
  color: #64748b;
  font-size: 0.9rem;
  margin: 8px 0;
  line-height: 1.4;
`;

const RoomStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
`;

const MemberCount = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.9rem;
`;

const RoomActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &.join {
    background: #10b981;
    color: white;
    &:hover {
      background: #059669;
    }
  }
  
  &.edit {
    background: #f59e0b;
    color: white;
    &:hover {
      background: #d97706;
    }
  }
  
  &.delete {
    background: #ef4444;
    color: white;
    &:hover {
      background: #dc2626;
    }
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h3`
  color: #1e293b;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 20px 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  color: #374151;
  font-weight: 500;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const TextArea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 80px;
  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &.primary {
    background: #2563eb;
    color: white;
    &:hover {
      background: #1d4ed8;
    }
  }
  
  &.secondary {
    background: #6b7280;
    color: white;
    &:hover {
      background: #4b5563;
    }
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #2563eb;
  font-size: 1.1rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #64748b;
  text-align: center;
`;

const CenteredContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  width: 100%;
`;

const SectionTitle = styled.h2`
  color: #2563eb;
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  text-align: center;
`;

const NoScrollWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const TwoColumn = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
`;

const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #f8fafc;
  min-height: 0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #2563eb;
  font-size: 1.2rem;
  cursor: pointer;
  margin-right: 12px;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 0 8px 0;
`;

const ChatTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const DeleteChatButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.9rem;
  cursor: pointer;
  margin-left: 8px;
`;

const SidebarToggle = styled.button`
  background: none;
  border: none;
  color: #2563eb;
  font-size: 1.2rem;
  cursor: pointer;
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 16px 16px 16px;
  overflow-y: auto;
  background: #f8fafc;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 12px;
`;

const Message = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-end;
  margin-bottom: 12px;
  flex-direction: ${props => props.isUser ? 'row-reverse' : 'row'};
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e7ef;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-size: 18px;
`;

const SenderName = styled.span`
  font-weight: 600;
  color: #2563eb;
  font-size: 0.95rem;
`;

const MessageContent = styled.div`
  background: ${props => props.isUser ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' : '#e0e7ef'};
  color: ${props => props.isUser ? 'white' : '#1e293b'};
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 0.98rem;
  max-width: 70%;
  word-break: break-word;
`;

const MessageTime = styled.span`
  font-size: 0.8rem;
  color: #64748b;
  margin-left: 8px;
`;

const ChatInput = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #e0e7ef;
`;

const ParticipantsSidebar = styled.div`
  width: 320px;
  background: #f1f5f9;
  border-left: 1px solid #e0e7ef;
  display: ${props => props.showParticipants ? 'block' : 'none'};
  height: 100%;
  overflow-y: auto;
`;

const MemberSectionTitle = styled.h4`
  color: #2563eb;
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 12px 0;
`;

const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  cursor: pointer;
`;

const MemberName = styled.span`
  font-weight: 500;
  color: #1e293b;
`;

const SectionDivider = styled.hr`
  border: none;
  border-top: 1px solid #e0e7ef;
  margin: 16px 0;
`;

const MemberActionMenu = styled.div`
  position: absolute;
  background: white;
  border: 1px solid #e0e7ef;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 10;
  padding: 8px 0;
`;

const MemberActionItem = styled.div`
  padding: 8px 18px;
  cursor: pointer;
  color: #1e293b;
  &:hover { background: #f1f5f9; }
`;

const DropdownMenuItem = styled.div`
  padding: 8px 18px;
  cursor: pointer;
  color: #1e293b;
  &:hover { background: #f1f5f9; }
`;

const TopicList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const TopicBox = styled.div`
  background: white;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid #e0e7ef;
  position: relative;
`;

const ThreeDotsIcon = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  cursor: pointer;
  color: #64748b;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 36px;
  right: 0;
  background: white;
  border: 1px solid #e0e7ef;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 10;
  min-width: 160px;
`;

const TopicTitle = styled.h4`
  color: #2563eb;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 8px 0;
`;

const TopicMeta = styled.div`
  color: #64748b;
  font-size: 0.92rem;
  margin-bottom: 4px;
`;

const TopicActions = styled.div`
  margin-top: 12px;
`;

const FormOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const FormBox = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
`;

const FormTitle = styled.h3`
  color: #2563eb;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 20px 0;
`;

const FormInput = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 12px;
`;

const FormButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  background: #2563eb;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 8px;
  &:hover { background: #1d4ed8; }
`;

const Rooms = () => {
  const { user, session, makeAuthenticatedRequest, isAuthenticated } = useUserContext();
  const navigate = useNavigate();
  const [view, setView] = useState('rooms'); // rooms | topics | chat
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [rooms, setRooms] = useState([]); // API-driven
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: 'Welcome to the topic group chat!', isUser: false }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showParticipants, setShowParticipants] = useState(true);
  const [memberAction, setMemberAction] = useState({ show: false, user: null, anchor: null });
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [showRoomMenu, setShowRoomMenu] = useState(null);
  const [showTopicMenu, setShowTopicMenu] = useState(null);
  const [showCreateTopicForm, setShowCreateTopicForm] = useState(false);
  const [showAuthError, setShowAuthError] = useState(false);
  const [adminLeavePrompt, setAdminLeavePrompt] = useState(false);
  const [leavingRoomId, setLeavingRoomId] = useState(null);
  const [roomChatMessages, setRoomChatMessages] = useState({});
  const [newRoomName, setNewRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinRoomPass, setJoinRoomPass] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  // Loading states for specific operations
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [leavingRoom, setLeavingRoom] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // WebSocket state
  const [websocket, setWebsocket] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsReconnecting, setWsReconnecting] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Alphabetical member list
  const memberList = selectedRoom ? [...selectedRoom.members].sort() : [];

  // Helper: check if current user is admin in a room
  const isAdmin = (room) => room.admins.some(a => a.email === user?.email);

  // Helper: get sorted admins and members
  const getSortedAdmins = (room) => [...room.admins].sort((a, b) => a.name.localeCompare(b.name));
  const getSortedMembers = (room) => [...room.members].sort((a, b) => a.name.localeCompare(b.name));

  // WebSocket management
  const connectWebSocket = (roomId, topicId) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const backendUrl = process.env.REACT_APP_API_URL || 'https://ai-room-collaborator.onrender.com';
    const token = localStorage.getItem('airoom_jwt_token');
    
    if (!token) {
      toast.error('Authentication token not available');
      return;
    }

    const wsUrl = `${backendUrl.replace(/^http/, 'ws')}/api/chat/ws/${roomId}/${topicId}?token=${encodeURIComponent(token)}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
      setWsReconnecting(false);
      toast.success('Connected to chat');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setWsConnected(false);
      
      if (event.code !== 1000 && !wsReconnecting) {
        // Attempt to reconnect
        setWsReconnecting(true);
        toast.warning('Connection lost. Reconnecting...');
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (selectedRoom && selectedTopic) {
            connectWebSocket(selectedRoom.id, selectedTopic.id);
          }
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('WebSocket connection error');
    };

    setWebsocket(ws);
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connection_established':
        console.log('WebSocket connection established');
        break;
      case 'chat_message':
        // Handle incoming chat message
        const newMessage = {
          id: Date.now(),
          text: data.data.content,
          isUser: false,
          sender: data.data.user_name || 'User',
          time: new Date().toLocaleTimeString()
        };
        setRoomChatMessages(prev => ({
          ...prev,
          [selectedTopic.title]: [...(prev[selectedTopic.title] || []), newMessage]
        }));
        break;
      case 'user_joined':
        toast.info(`${data.data.user_name} joined the chat`);
        break;
      case 'user_left':
        toast.info(`${data.data.user_name} left the chat`);
        break;
      case 'error':
        toast.error(data.data.message || 'An error occurred');
        break;
      case 'pong':
        // Handle ping/pong for keepalive
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  const sendWebSocketMessage = (message, type = 'chat') => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: type,
        content: message
      }));
    } else {
      toast.error('Not connected to chat');
    }
  };

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Handlers with improved error handling and loading states
  const handleEnterRoom = (room) => {
    setSelectedRoom(room);
    setView('topics');
    fetchTopics(room.id, setSelectedRoom, setLoading, setError);
  };

  const handleBackToRooms = () => {
    setSelectedRoom(null);
    setView('rooms');
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setView('topics');
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    setView('chat');
    
    // Initialize chat messages if not exists
    if (!roomChatMessages[topic.title]) {
      setRoomChatMessages(prev => ({
        ...prev,
        [topic.title]: [{ 
          id: 1, 
          text: `Welcome to the topic: ${topic.title}!`, 
          isUser: false, 
          sender: 'AI', 
          avatar: '/ai_logo.png', 
          time: new Date().toLocaleTimeString() 
        }]
      }));
    }
    
    setChatInput('');
    
    // Connect to WebSocket
    connectWebSocket(selectedRoom.id, topic.id);
  };

  // Create room with optimistic update
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error('Room name is required');
      return;
    }
    
    setCreatingRoom(true);
    setError(null);
    
    // Optimistic update
    const optimisticRoom = {
      id: `temp_${Date.now()}`,
      name: newRoomName,
      created_by: user.id,
      members: [{ id: user.id, name: user.name, email: user.email }],
      admins: [{ id: user.id, name: user.name, email: user.email }],
      topics: []
    };
    
    const originalRooms = [...rooms];
    setRooms(prev => [...prev, optimisticRoom]);
    
    try {
      const res = await makeAuthenticatedRequest('/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newRoomName, description: newRoomDesc }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create room');
      }
      
      const data = await res.json();
      
      // Replace optimistic room with real room
      setRooms(prev => prev.map(room => 
        room.id === optimisticRoom.id ? { ...room, id: data.id } : room
      ));
      
      setShowCreate(false);
      setNewRoomName('');
      setNewRoomDesc('');
      toast.success('Room created successfully!');
      
      // Refresh rooms list to ensure persistence
      await fetchRooms(setRooms, setLoading, setError);
      
    } catch (err) {
      // Rollback optimistic update
      setRooms(originalRooms);
      const errorMessage = err.message || 'Error creating room';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCreatingRoom(false);
    }
  };

  // Join room with optimistic update
  const handleJoinRoom = async () => {
    if (!joinRoomId.trim() || !joinRoomPass.trim()) {
      setErrorPopup('Room ID and password are required');
      return;
    }
    setJoiningRoom(true);
    setError(null);
    try {
      const res = await makeAuthenticatedRequest('/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: joinRoomId, password: joinRoomPass }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setErrorPopup(errorData.detail || 'Failed to join room');
        throw new Error(errorData.detail || 'Failed to join room');
      }
      setShowJoin(false);
      setJoinRoomId('');
      setJoinRoomPass('');
      await fetchRooms(setRooms, setLoading, setError);
      toast.success('Successfully joined room!');
    } catch (err) {
      // errorPopup already set above
    } finally {
      setJoiningRoom(false);
    }
  };

  // Chat send with optimistic update
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    
    setSendingMessage(true);
    
    // Optimistic update
    const newMessage = { 
      id: Date.now(), 
      text: chatInput, 
      isUser: true, 
      sender: user?.name, 
      avatar: user?.avatar, 
      time: new Date().toLocaleTimeString() 
    };
    
    const originalMessages = roomChatMessages[selectedTopic.title] || [];
    setRoomChatMessages(prev => ({
      ...prev,
      [selectedTopic.title]: [...(prev[selectedTopic.title] || []), newMessage]
    }));
    
    const messageToSend = chatInput;
    setChatInput('');
    
    try {
      // Send via WebSocket
      sendWebSocketMessage(messageToSend, messageToSend.toLowerCase().includes('@chatbot') ? 'ai_request' : 'chat');
      
      // If it's an AI request, add a temporary "thinking" message
      if (messageToSend.toLowerCase().includes('@chatbot')) {
        setTimeout(() => {
          const thinkingMessage = { 
            id: Date.now() + 1, 
            text: "AI is thinking...", 
            isUser: false, 
            sender: 'AI', 
            avatar: '/ai_logo.png', 
            time: new Date().toLocaleTimeString() 
          };
          setRoomChatMessages(prev => ({
            ...prev,
            [selectedTopic.title]: [...(prev[selectedTopic.title] || []), thinkingMessage]
          }));
        }, 500);
      }
      
    } catch (err) {
      // Rollback optimistic update
      setRoomChatMessages(prev => ({
        ...prev,
        [selectedTopic.title]: originalMessages
      }));
      setChatInput(messageToSend);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Leave room with confirmation
  const handleLeaveRoom = async (roomId) => {
    setLeavingRoom(true);
    setError(null);
    
    try {
      const res = await makeAuthenticatedRequest(`/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to leave room');
      }
      
      setSelectedRoom(null);
      setView('rooms');
      setShowRoomMenu(null);
      await fetchRooms(setRooms, setLoading, setError);
      toast.success('Successfully left room');
      
    } catch (err) {
      const errorMessage = err.message || 'Error leaving room';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLeavingRoom(false);
    }
  };

  // Delete room with confirmation
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }
    
    setDeletingRoom(true);
    setError(null);
    
    try {
      const res = await makeAuthenticatedRequest(`/rooms/${roomId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete room');
      }
      
      setSelectedRoom(null);
      setView('rooms');
      setShowRoomMenu(null);
      await fetchRooms(setRooms, setLoading, setError);
      toast.success('Room deleted successfully');
      
    } catch (err) {
      const errorMessage = err.message || 'Error deleting room';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeletingRoom(false);
    }
  };

  // Create topic with optimistic update
  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim()) {
      toast.error('Topic title is required');
      return;
    }
    
    setCreatingTopic(true);
    setError(null);
    
    // Optimistic update
    const optimisticTopic = {
      id: `temp_${Date.now()}`,
      title: newTopicTitle,
      description: newTopicDesc,
      createdBy: user?.name,
      date: new Date().toLocaleDateString()
    };
    
    const originalTopics = selectedRoom.topics || [];
    setSelectedRoom(prev => prev ? {
      ...prev,
      topics: [...(prev.topics || []), optimisticTopic]
    } : prev);
    
    try {
      const res = await makeAuthenticatedRequest('/topics/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          room_id: selectedRoom.id, 
          title: newTopicTitle, 
          description: newTopicDesc 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create topic');
      }
      
      setShowCreateTopicForm(false);
      setNewTopicTitle('');
      setNewTopicDesc('');
      toast.success('Topic created successfully!');
      
    } catch (err) {
      // Rollback optimistic update
      setSelectedRoom(prev => prev ? {
        ...prev,
        topics: originalTopics
      } : prev);
      
      const errorMessage = err.message || 'Error creating topic';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCreatingTopic(false);
    }
  };

  // Delete topic with confirmation
  const handleDeleteTopic = async (topic) => {
    if (!user) {
      toast.error('You must be logged in to delete topics');
      return;
    }

    if (!isAdmin(selectedRoom) && topic.createdBy !== user.name) {
      setShowAuthError(true);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('airoom_jwt_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/topics/${topic.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        toast.success('Topic deleted successfully');
        // Remove topic from local state
        setSelectedRoom(prev => ({
          ...prev,
          topics: prev.topics.filter(t => t.title !== topic.title)
        }));
        // Clear chat messages for this topic
        setRoomChatMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[topic.title];
          return newMessages;
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to delete topic');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error('Failed to delete topic');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!user || !selectedTopic) {
      toast.error('No topic selected for chat deletion');
      return;
    }

    if (!isAdmin(selectedRoom)) {
      toast.error('Only admins can delete chat conversations');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('airoom_jwt_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/${selectedRoom.id}/${selectedTopic.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        toast.success('Chat conversation deleted successfully');
        // Clear chat messages for this topic
        setRoomChatMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[selectedTopic.title];
          return newMessages;
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to delete chat conversation');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async (userToPromote) => {
    if (!user || !selectedRoom) {
      toast.error('No room selected');
      return;
    }

    if (!isAdmin(selectedRoom)) {
      toast.error('Only admins can promote users');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('airoom_jwt_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/room/make-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          user_email: userToPromote.email
        })
      });

      if (response.ok) {
        toast.success(`${userToPromote.name} is now an admin`);
        // Update local state
        setSelectedRoom(prev => ({
          ...prev,
          admins: [...prev.admins, userToPromote],
          members: prev.members.filter(m => m.email !== userToPromote.email)
        }));
        setMemberAction({ show: false, user: null, anchor: null });
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to promote user');
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error('Failed to promote user');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userToRemove) => {
    if (!user || !selectedRoom) {
      toast.error('No room selected');
      return;
    }

    if (!isAdmin(selectedRoom)) {
      toast.error('Only admins can remove users');
      return;
    }

    if (userToRemove.email === user.email) {
      toast.error('You cannot remove yourself');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('airoom_jwt_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/room/remove-user`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          user_email: userToRemove.email
        })
      });

      if (response.ok) {
        toast.success(`${userToRemove.name} has been removed from the room`);
        // Update local state
        setSelectedRoom(prev => ({
          ...prev,
          admins: prev.admins.filter(a => a.email !== userToRemove.email),
          members: prev.members.filter(m => m.email !== userToRemove.email)
        }));
        setMemberAction({ show: false, user: null, anchor: null });
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to remove user');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (setRooms, setLoading, setError) => {
    setLoading(true);
    setError(null);
    try {
      const res = await makeAuthenticatedRequest('/rooms/my-rooms');
      
      if (!res.ok) {
        // Log the response text to see the actual error (e.g., HTML page)
        const errorText = await res.text();
        console.error("Failed to fetch rooms:", errorText);
        throw new Error(`Server responded with status ${res.status}`);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        setError('Server error: Received non-JSON response.');
        toast.error('Server error: Received non-JSON response.');
        return;
      }
      const data = await res.json();
      // Backend returns direct array, not { rooms: [...] }
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err.message || 'Error fetching rooms';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (roomId, setSelectedRoom, setLoading, setError) => {
    setLoading(true);
    setError(null);
    try {
      const res = await makeAuthenticatedRequest(`/topics/room/${roomId}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch topics:", errorText);
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setSelectedRoom(prev => prev ? { ...prev, topics: data.topics || [] } : prev);
    } catch (err) {
      const errorMessage = err.message || 'Error fetching topics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms(setRooms, setLoading, setError);
    }
  }, [isAuthenticated]);

  // Add state for password modal and error popup
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);

  // Add state for which room's menu is open
  const [openRoomMenu, setOpenRoomMenu] = useState(null);

  // Helper: check if user is a member of a room
  const isMember = (room) => room.members && room.members.some(m => m.id === user?.id);

  // Helper: fetch and show password for admin
  const handleRevealPassword = async (room) => {
    try {
      const res = await makeAuthenticatedRequest(`/rooms/${room.room_id}/reveal-password`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch password');
      }
      const data = await res.json();
      setRevealedPassword(data.password);
      setShowPasswordModal(true);
    } catch (err) {
      setErrorPopup(err.message || 'Error revealing password');
    }
  };

  // Add a useEffect to close the dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (openRoomMenu !== null) setOpenRoomMenu(null);
    };
    if (openRoomMenu !== null) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [openRoomMenu]);

  // Main render
  if (!isAuthenticated) {
    return <CenteredContent><SectionTitle>Please log in to access rooms.</SectionTitle></CenteredContent>;
  }
  if (loading) {
    return <CenteredContent><SectionTitle>Loading rooms...</SectionTitle></CenteredContent>;
  }
  if (error) {
    return <CenteredContent><SectionTitle>Error: {error}</SectionTitle></CenteredContent>;
  }
  if (view === 'chat') {
    return (
      <NoScrollWrapper>
        <TwoColumn>
          <MainArea showParticipants={showParticipants}>
            <BackButton onClick={handleBackToTopics}><FaChevronLeft /></BackButton>
            <ChatHeader>
              <ChatTitle>{selectedTopic.title}</ChatTitle>
              <div style={{display: 'flex', gap: '10px', marginLeft: 'auto'}}>
                {isAdmin(selectedRoom) && (
                  <DeleteChatButton onClick={() => handleDeleteChat()}><FaTrash /> Delete Conversation</DeleteChatButton>
                )}
                <SidebarToggle onClick={() => setShowParticipants(!showParticipants)} title={showParticipants ? "Hide Participants" : "Show Participants"} style={{position: 'relative', top: 'auto', right: 'auto'}}>
                  {showParticipants ? <FaChevronRight /> : <FaChevronLeft />}
                </SidebarToggle>
              </div>
            </ChatHeader>
            <ChatArea style={{margin:'0 auto',width:'100%',flex:'1'}}>
              <ChatMessages>
                {roomChatMessages[selectedTopic.title]?.map((msg, idx) => (
                  <Message key={msg.id} isUser={msg.isUser}>
                    <MessageHeader isUser={msg.isUser}>
                      <Avatar isUser={msg.isUser}>
                        {msg.isUser ? (
                          <FaUser />
                        ) : (
                          <img src="/ai_logo.png" alt="Chatbot Logo" />
                        )}
                      </Avatar>
                      <SenderName>{msg.isUser ? msg.sender : 'Chatbot'}</SenderName>
                    </MessageHeader>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isUser ? 'flex-end' : 'flex-start' }}>
                        <MessageContent isUser={msg.isUser}>{msg.text}</MessageContent>
                        <MessageTime>{msg.time}</MessageTime>
                    </div>
                  </Message>
                ))}
              </ChatMessages>
              <ChatInput>
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                />
                <ActionButton onClick={handleSendChat}>Send</ActionButton>
              </ChatInput>
            </ChatArea>
          </MainArea>
          <ParticipantsSidebar showParticipants={showParticipants}>
            <div style={{width:'100%',padding:'24px 18px 0 18px',overflowY:'auto'}}>
              <MemberSectionTitle>Admins</MemberSectionTitle>
              {getSortedAdmins(selectedRoom).map(admin => (
                <MemberRow key={admin.email}>
                  <Avatar src={admin.avatar} alt={admin.name} />
                  <MemberName>{admin.name}</MemberName>
                  <FaCrown style={{color:'#f59e0b',marginLeft:4}} title="Admin" />
                </MemberRow>
              ))}
              <SectionDivider />
              <MemberSectionTitle>Members</MemberSectionTitle>
              {getSortedMembers(selectedRoom).map(member => (
                <MemberRow key={member.email} onClick={isAdmin(selectedRoom) ? (e) => setMemberAction({ show: true, user: member, anchor: e.currentTarget }) : undefined}>
                  <Avatar src={member.avatar} alt={member.name} />
                  <MemberName>{member.name}</MemberName>
                </MemberRow>
              ))}
            </div>
            {memberAction.show && memberAction.user && (
              <MemberActionMenu style={{top: memberAction.anchor.getBoundingClientRect().top-60}}>
                <MemberActionItem onClick={() => handleMakeAdmin(memberAction.user)}><FaUserShield /> Make Admin</MemberActionItem>
                <MemberActionItem onClick={() => handleRemoveUser(memberAction.user)} style={{color:'#ef4444'}}><FaTimes /> Remove User</MemberActionItem>
                <DropdownMenuItem onClick={() => setMemberAction({ show: false, user: null, anchor: null })}><FaTimes /> Cancel</DropdownMenuItem>
              </MemberActionMenu>
            )}
          </ParticipantsSidebar>
        </TwoColumn>
      </NoScrollWrapper>
    );
  }
  if (view === 'topics') {
    return (
      <NoScrollWrapper>
        <TwoColumn>
          <MainArea showParticipants={showParticipants}>
            <BackButton onClick={handleBackToRooms}><FaChevronLeft /></BackButton>
            <SectionTitle style={{textAlign:'center',marginTop:80}}>Topics in {selectedRoom.name}</SectionTitle>
            <div style={{position: 'absolute', top: 16, right: 16, display: 'flex', gap: '10px'}}>
              <ActionButton onClick={() => setShowCreateTopicForm(true)}><FaPlus /> Create New Topic</ActionButton>
              <SidebarToggle onClick={() => setShowParticipants(!showParticipants)} title={showParticipants ? "Hide Participants" : "Show Participants"} style={{position: 'relative', top: 'auto', right: 'auto'}}>
                {showParticipants ? <FaChevronRight /> : <FaChevronLeft />}
              </SidebarToggle>
            </div>
            <TopicList style={{margin:'32px auto 0 auto',width:'90%'}}>
              {selectedRoom.topics.map(topic => (
                <TopicBox key={topic.title}>
                  <ThreeDotsIcon onClick={(e) => { e.stopPropagation(); setShowTopicMenu(topic.title); }}><FaEllipsisV /></ThreeDotsIcon>
                  {showTopicMenu === topic.title && (
                    <DropdownMenu>
                      {(isAdmin(selectedRoom) || topic.createdBy === user?.name) && (
                        <DropdownMenuItem className="delete" onClick={() => handleDeleteTopic(topic)}><FaTrash /> Delete Topic</DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setShowTopicMenu(null)}><FaTimes /> Cancel</DropdownMenuItem>
                    </DropdownMenu>
                  )}
                  <TopicTitle>{topic.title}</TopicTitle>
                  <TopicMeta>{topic.description}</TopicMeta>
                  <TopicMeta>Created by {topic.createdBy} on {topic.date}</TopicMeta>
                  <TopicActions>
                    <ActionButton onClick={() => handleTopicClick(topic)}><FaSignInAlt /> Enter Topic</ActionButton>
                  </TopicActions>
                </TopicBox>
              ))}
            </TopicList>
            {/* Create Topic Form Overlay */}
            {showCreateTopicForm && (
              <FormOverlay onClick={() => setShowCreateTopicForm(false)}>
                <FormBox onClick={e => e.stopPropagation()}>
                  <FormTitle>Create New Topic</FormTitle>
                  <FormInput
                    placeholder="Topic Title"
                    value={newTopicTitle}
                    onChange={e => setNewTopicTitle(e.target.value)}
                  />
                  <FormInput
                    placeholder="Description"
                    value={newTopicDesc}
                    onChange={e => setNewTopicDesc(e.target.value)}
                  />
                  <FormButton onClick={handleCreateTopic}>Create Topic</FormButton>
                </FormBox>
              </FormOverlay>
            )}
          </MainArea>
          <ParticipantsSidebar showParticipants={showParticipants}>
            <div style={{width:'100%',padding:'24px 18px 0 18px',overflowY:'auto'}}>
              <MemberSectionTitle>Admins</MemberSectionTitle>
              {getSortedAdmins(selectedRoom).map(admin => (
                <MemberRow key={admin.email}>
                  <Avatar src={admin.avatar} alt={admin.name} />
                  <MemberName>{admin.name}</MemberName>
                  <FaCrown style={{color:'#f59e0b',marginLeft:4}} title="Admin" />
                </MemberRow>
              ))}
              <SectionDivider />
              <MemberSectionTitle>Members</MemberSectionTitle>
              {getSortedMembers(selectedRoom).map(member => (
                <MemberRow key={member.email} onClick={isAdmin(selectedRoom) ? (e) => setMemberAction({ show: true, user: member, anchor: e.currentTarget }) : undefined}>
                  <Avatar src={member.avatar} alt={member.name} />
                  <MemberName>{member.name}</MemberName>
                </MemberRow>
              ))}
            </div>
            {memberAction.show && memberAction.user && (
              <MemberActionMenu style={{top: memberAction.anchor.getBoundingClientRect().top-60}}>
                <MemberActionItem onClick={() => handleMakeAdmin(memberAction.user)}><FaUserShield /> Make Admin</MemberActionItem>
                <MemberActionItem onClick={() => handleRemoveUser(memberAction.user)} style={{color:'#ef4444'}}><FaTimes /> Remove User</MemberActionItem>
                <DropdownMenuItem onClick={() => setMemberAction({ show: false, user: null, anchor: null })}><FaTimes /> Cancel</DropdownMenuItem>
              </MemberActionMenu>
            )}
          </ParticipantsSidebar>
        </TwoColumn>
      </NoScrollWrapper>
    );
  }
  // Default: rooms list
  return (
    <Container>
      <Header>
        <Title>Study Rooms</Title>
        <div style={{ display: 'flex', gap: '12px' }}>
          <CreateButton onClick={() => setShowCreate(true)}>
            <FaPlus />
            Create Room
          </CreateButton>
          <CreateButton style={{ background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' }} onClick={() => setShowJoin(true)}>
            <FaSignInAlt />
            Join Room
          </CreateButton>
        </div>
      </Header>

      {rooms.length === 0 ? (
        <EmptyState>
          <FaUsers size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <h3>No rooms available</h3>
          <p>Create a new room to get started!</p>
        </EmptyState>
      ) : (
        <RoomsGrid>
          {rooms.map((room) => {
            const userIsAdmin = isAdmin(room);
            const userIsMember = isMember(room);
            const adminCount = room.admins ? room.admins.length : 0;
            return (
              <RoomCard key={room.id} style={{position:'relative'}}>
                <RoomHeader>
                  <RoomTitle>{room.name}</RoomTitle>
                  <RoomStatus isPrivate={room.is_private}>
                    {room.is_private ? <FaLock /> : <FaUnlock />}
                    {room.is_private ? 'Private' : 'Public'}
                  </RoomStatus>
                  {/* 3-dot menu for all members */}
                  {userIsMember && (
                    <div style={{position:'relative'}}>
                      <ThreeDotsIcon onClick={e => { e.stopPropagation(); setOpenRoomMenu(openRoomMenu === room.id ? null : room.id); }} title="Room Actions">
                        <FaEllipsisV />
                      </ThreeDotsIcon>
                      {openRoomMenu === room.id && (
                        <DropdownMenu style={{right:0, top:32, zIndex:20}}>
                          {userIsAdmin && <DropdownMenuItem onClick={() => { setOpenRoomMenu(null); handleRevealPassword(room); }}>Reveal Password</DropdownMenuItem>}
                          {userIsAdmin && <DropdownMenuItem onClick={() => { setOpenRoomMenu(null); handleDeleteRoom(room.id); }} style={{color:'#ef4444'}}>Delete Room</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => {
                            setOpenRoomMenu(null);
                            // Admin leave constraint
                            if (userIsAdmin && adminCount === 1) {
                              setAdminLeavePrompt(true);
                            } else {
                              handleLeaveRoom(room.id);
                            }
                          }} style={{color:'#ef4444'}}>Leave Room</DropdownMenuItem>
                        </DropdownMenu>
                      )}
                    </div>
                  )}
                </RoomHeader>
                <div style={{fontSize:'0.95rem',color:'#2563eb',marginBottom:4}}>
                  Room ID: <b>{room.room_id}</b>
                </div>
                <RoomDescription>
                  {room.description || 'No description available'}
                </RoomDescription>
                <RoomStats>
                  <MemberCount>
                    <FaUsers />
                    {room.participant_count || 0} members
                  </MemberCount>
                  <RoomActions>
                    {userIsMember ? (
                      <ActionButton className="join" onClick={() => handleEnterRoom(room)}>
                        <FaSignInAlt />
                        Enter
                      </ActionButton>
                    ) : null}
                  </RoomActions>
                </RoomStats>
              </RoomCard>
            );
          })}
        </RoomsGrid>
      )}

      {/* Create Room Modal */}
      {showCreate && (
        <FormOverlay onClick={() => setShowCreate(false)}>
          <FormBox onClick={e => e.stopPropagation()}>
            <FormTitle>Create New Room</FormTitle>
            <FormInput
              placeholder="Room Name"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
            />
            <TextArea
              placeholder="Room Description (optional)"
              value={newRoomDesc}
              onChange={e => setNewRoomDesc(e.target.value)}
              style={{marginBottom:'12px'}}
            />
            <FormButton onClick={handleCreateRoom}>Create Room</FormButton>
          </FormBox>
        </FormOverlay>
      )}
      {showJoin && (
        <FormOverlay onClick={() => setShowJoin(false)}>
          <FormBox onClick={e => e.stopPropagation()}>
            <FormTitle>Join Room</FormTitle>
            <FormInput
              placeholder="Room ID"
              value={joinRoomId}
              onChange={e => setJoinRoomId(e.target.value)}
            />
            <FormInput
              placeholder="Room Password (8 digits)"
              value={joinRoomPass}
              onChange={e => setJoinRoomPass(e.target.value)}
            />
            <FormButton onClick={handleJoinRoom}>Join Room</FormButton>
          </FormBox>
        </FormOverlay>
      )}
      {adminLeavePrompt && (
        <FormOverlay onClick={() => setAdminLeavePrompt(false)}>
          <FormBox onClick={e => e.stopPropagation()}>
            <FormTitle style={{color:'#ef4444'}}>Cannot Leave Room</FormTitle>
            <p style={{textAlign:'center', marginBottom:'20px', color:'#4b5563'}}>
              You are the last administrator of this room. Please make another member an admin before leaving.
              (Future feature: Select new admin from members)
            </p>
            <FormButton onClick={() => setAdminLeavePrompt(false)}>OK</FormButton>
          </FormBox>
        </FormOverlay>
      )}
      {showAuthError && (
        <FormOverlay onClick={() => setShowAuthError(false)}>
          <FormBox onClick={e => e.stopPropagation()}>
            <FormTitle style={{color:'#ef4444'}}>Authorization Denied</FormTitle>
            <p style={{textAlign:'center', marginBottom:'20px', color:'#4b5563'}}>
              You do not have the necessary authorization to delete this topic.
            </p>
            <FormButton onClick={() => setShowAuthError(false)}>OK</FormButton>
          </FormBox>
        </FormOverlay>
      )}
      {showPasswordModal && (
        <FormOverlay onClick={() => setShowPasswordModal(false)}>
          <FormBox onClick={e => e.stopPropagation()}>
            <FormTitle>Room Password</FormTitle>
            <div style={{fontSize:'1.3rem',textAlign:'center',margin:'18px 0'}}><b>{revealedPassword}</b></div>
            <FormButton onClick={() => setShowPasswordModal(false)}>Close</FormButton>
          </FormBox>
        </FormOverlay>
      )}
      {errorPopup && (
        <FormOverlay onClick={() => setErrorPopup(null)}>
          <FormBox onClick={e => e.stopPropagation()}>
            <FormTitle style={{color:'#ef4444'}}>Error</FormTitle>
            <p style={{textAlign:'center', marginBottom:'20px', color:'#4b5563'}}>{errorPopup}</p>
            <FormButton onClick={() => setErrorPopup(null)}>OK</FormButton>
          </FormBox>
        </FormOverlay>
      )}
    </Container>
  );
};

export default Rooms; 