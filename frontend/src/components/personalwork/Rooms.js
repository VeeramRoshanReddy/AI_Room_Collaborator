import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaPlus, FaSignInAlt, FaClock, FaChevronRight, FaChevronLeft, FaEllipsisV, FaTrash, FaUser, FaCrown, FaUserShield, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context/UserContext';
import { toast } from 'react-toastify';

const NoScrollWrapper = styled.div`
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const CenteredContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  height: 100%;
  min-height: 0;
`;

const TwoColumn = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
`;

const MainArea = styled.div`
  flex: ${props => props.showParticipants ? '0 0 80%' : '0 0 100%'};
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: #f8fafc;
  border-radius: ${props => props.showParticipants ? '14px 0 0 14px' : '14px'};
  margin-top: 0;
  margin-bottom: 0;
  margin-left: 0;
  margin-right: 0;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.10);
  position: relative;
  transition: flex 0.3s ease-in-out, border-radius 0.3s ease-in-out;
`;

const ParticipantsSidebar = styled.div`
  background: rgba(241,245,253,0.98);
  border-radius: 0 14px 14px 0;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.06);
  padding: 0 0 0 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: ${props => props.showParticipants ? '120px' : '0px'};
  max-width: ${props => props.showParticipants ? '260px' : '0px'};
  height: 100%;
  margin: 0;
  position: relative;
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), flex 0.3s ease-in-out, min-width 0.3s ease-in-out, max-width 0.3s ease-in-out;
  z-index: 10;
  flex: ${props => props.showParticipants ? '0 0 20%' : '0 0 0%'};
  transform: translateX(${props => props.showParticipants ? '0' : '100%'});
  overflow: hidden;
`;

const SidebarToggle = styled.button`
  position: absolute;
  top: 18px;
  right: 18px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.10);
  cursor: pointer;
  z-index: 20;
`;

const MemberName = styled.div`
  font-size: 1rem;
  color: #1e293b;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #1d4ed8;
  margin-bottom: 18px;
  font-family: 'Poppins', 'Inter', 'Montserrat', sans-serif;
`;

const RoomList = styled.div`
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  margin-bottom: 32px;
  justify-content: center;
`;

const RoomBox = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.10);
  padding: 28px 24px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 12px;
  transition: box-shadow 0.2s;
  position: relative;
  &:hover {
    box-shadow: 0 8px 32px rgba(37, 99, 235, 0.18);
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
  &.leave {
    color: #eab308;
  }
`;

const RoomMeta = styled.div`
  font-size: 0.95rem;
  color: #64748b;
  margin-bottom: 10px;
`;

const RoomActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.10);
  transition: background 0.2s;
  &:hover {
    background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%);
  }
`;

const TopicList = styled.div`
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 32px;
  justify-content: center;
`;

const TopicBox = styled.div`
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.10);
  padding: 22px 20px;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 12px;
  transition: box-shadow 0.2s;
  position: relative;
  &:hover {
    box-shadow: 0 8px 32px rgba(37, 99, 235, 0.18);
  }
`;

const TopicTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
`;

const TopicMeta = styled.div`
  font-size: 0.95rem;
  color: #64748b;
  margin-bottom: 10px;
`;

const TopicActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.10);
  padding: 20px;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  position: relative;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const ChatInput = styled.div`
  display: flex;
  gap: 10px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1.5px solid #60a5fa;
  border-radius: 8px;
  font-size: 15px;
  background: #fff;
`;

const Message = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
  align-items: flex-start;
  flex-direction: ${props => props.isUser ? 'row-reverse' : 'row'};
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  ${props => props.isUser ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
`;

const SenderName = styled.span`
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
`;

const MessageTime = styled.span`
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 5px; /* Add margin to separate from content */
`;

const MessageContent = styled.div`
  background: ${props => props.isUser ? '#dbeafe' : '#eff6ff'};
  color: #1e293b;
  padding: 10px 14px;
  border-radius: 18px;
  max-width: 75%;
  word-wrap: break-word; /* Ensure long words break */
  overflow-wrap: break-word; /* Modern property for word breaking */
  white-space: pre-wrap; /* Preserve whitespace and wrap text */
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  font-size: 0.95rem;
  line-height: 1.4;
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
  overflow: hidden; /* Ensure image is contained */

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
`;

const BackButton = styled.button`
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
  transition: all 0.2s;

  &:hover {
    background: #1d4ed8;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }
`;

const FormOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const FormBox = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.18);
  padding: 32px 28px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FormTitle = styled.h3`
  color: #2563eb;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 18px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #60a5fa;
  border-radius: 8px;
  font-size: 15px;
  margin-bottom: 16px;
`;

const FormButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  margin-top: 8px;
`;

const SectionDivider = styled.div`
  width: 100%;
  height: 1px;
  background: #e0e7ef;
  margin: 12px 0 8px 0;
`;

const MemberSectionTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #2563eb;
  margin: 12px 0 6px 0;
`;

const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  width: 100%;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
  &:hover {
    background: #e0e7ef;
  }
`;

const MemberActionMenu = styled.div`
  position: absolute;
  right: 16px;
  top: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.18);
  padding: 8px 0;
  min-width: 140px;
  z-index: 100;
`;

const MemberActionItem = styled.div`
  padding: 10px 18px;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #f1f5fd;
  }
`;

const ChatHeader = styled.div`
  padding: 18px 24px;
  background: rgba(255,255,255,0.7);
  border-bottom: 1px solid #e0e7ef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
  z-index: 10;
`;

const ChatTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 700;
  color: #1d4ed8;
  flex-grow: 1;
  text-align: center;
`;

const DeleteChatButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
  transition: background 0.2s;
  &:hover {
    background: #dc2626;
  }
`;

// Helper to get cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// Helper to get authentication token for WebSocket
const getAuthToken = (session) => {
  if (session?.access_token) return session.access_token;
  const storedToken = localStorage.getItem('airoom_supabase_token');
  if (storedToken) return storedToken;
  const cookieToken = document.cookie.split('; ').find(row => row.startsWith('airoom_session='))?.split('=')[1];
  return cookieToken;
};

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
    const token = getAuthToken(session);
    
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
      const password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-4);
      const res = await makeAuthenticatedRequest('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName, password }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create room');
      }
      
      const data = await res.json();
      
      // Replace optimistic room with real room
      setRooms(prev => prev.map(room => 
        room.id === optimisticRoom.id ? { ...room, id: data.room_id } : room
      ));
      
      setShowCreate(false);
      setNewRoomName('');
      toast.success('Room created successfully!');
      
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
      toast.error('Room ID and password are required');
      return;
    }
    
    setJoiningRoom(true);
    setError(null);
    
    try {
      const res = await makeAuthenticatedRequest('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: joinRoomId, password: joinRoomPass }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to join room');
      }
      
      setShowJoin(false);
      setJoinRoomId('');
      setJoinRoomPass('');
      
      // Refresh rooms list
      await fetchRooms(setRooms, setLoading, setError);
      toast.success('Successfully joined room!');
      
    } catch (err) {
      const errorMessage = err.message || 'Error joining room';
      setError(errorMessage);
      toast.error(errorMessage);
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
      const res = await makeAuthenticatedRequest('/api/room/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId }),
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
      const res = await makeAuthenticatedRequest('/api/room/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId }),
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
      const res = await makeAuthenticatedRequest('/api/topic/create', {
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
      const token = getAuthToken(session);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/topic/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          topic_title: topic.title
        })
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
      const token = getAuthToken(session);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          topic_title: selectedTopic.title
        })
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
      const token = getAuthToken(session);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/room/make-admin`, {
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
      const token = getAuthToken(session);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/room/remove-user`, {
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
      const res = await makeAuthenticatedRequest('/api/room/list');
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        setError('Server error: Received non-JSON response.');
        toast.error('Server error: Received non-JSON response.');
        return;
      }
      const data = await res.json();
      setRooms(data.rooms || []);
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
      const res = await makeAuthenticatedRequest(`/api/topic/list/${roomId}`);
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
    <NoScrollWrapper>
      <CenteredContent>
        <SectionTitle>Joined Rooms</SectionTitle>
        <RoomList>
          {rooms.map(room => (
            <RoomBox key={room.id}>
              <ThreeDotsIcon onClick={(e) => { e.stopPropagation(); setShowRoomMenu(room.id); }}><FaEllipsisV /></ThreeDotsIcon>
                {showRoomMenu === room.id && (
                  <DropdownMenu>
                    {isAdmin(room) ? (
                      <DropdownMenuItem className="delete" onClick={() => handleDeleteRoom(room.id)}><FaTrash /> Delete Room</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem className="leave" onClick={() => handleLeaveRoom(room.id)}><FaSignInAlt /> Leave Room</DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setShowRoomMenu(null)}><FaTimes /> Cancel</DropdownMenuItem>
                  </DropdownMenu>
                )}
              <h3>{room.name}</h3>
              <RoomMeta>{room.members.length + room.admins.length} Members</RoomMeta>
              <RoomMeta>{room.topics.length} Topics</RoomMeta>
              <RoomActions>
                <ActionButton onClick={() => handleEnterRoom(room)}><FaSignInAlt /> Enter Room</ActionButton>
              </RoomActions>
            </RoomBox>
          ))}
        </RoomList>
        <SectionTitle>Actions</SectionTitle>
        <RoomActions>
          <ActionButton onClick={() => setShowCreate(true)}><FaPlus /> Create New Room</ActionButton>
          <ActionButton onClick={() => setShowJoin(true)}><FaSignInAlt /> Join a Room</ActionButton>
        </RoomActions>
      </CenteredContent>
      {showCreate && (
        <FormOverlay onClick={() => setShowCreate(false)}>
          <FormBox onClick={e => e.stopPropagation()}>
            <FormTitle>Create New Room</FormTitle>
            <FormInput
              placeholder="Room Name"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
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
              placeholder="Room Password (16 chars)"
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
    </NoScrollWrapper>
  );
};

export default Rooms; 