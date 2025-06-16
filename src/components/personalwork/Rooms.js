import React, { useState } from 'react';
import styled from 'styled-components';
import { FaPlus, FaSignInAlt, FaUsers, FaClock, FaArrowLeft, FaCommentDots, FaUserShield, FaUser, FaCrown, FaTimes, FaChevronRight, FaChevronLeft, FaEllipsisV, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

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

const MemberList = styled.div`
  flex: 0 0 20%;
  background: #f1f5fd;
  border-radius: 0 14px 14px 0;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.06);
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 120px;
  max-width: 220px;
  height: 100%;
  margin: 0;
`;

const MemberTitle = styled.div`
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 12px;
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

const LeaveRoomButton = styled(ActionButton)`
  background: none; /* Remove background gradient */
  color: #FFD700; /* Yellow text */
  border: 1px solid #FFD700; /* Yellow border */
  &:hover {
    color: #FFF; /* White text on hover */
    background: #FFD700; /* Yellow background on hover */
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

// Dummy data
const dummyRooms = [
  {
    name: 'AI Study Group',
    id: '1234567890123456',
    admins: [
      { name: 'Alice', email: 'alice@gmail.com', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' }
    ],
    members: [
      { name: 'Bob', email: 'bob@gmail.com', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
      { name: 'Charlie', email: 'charlie@gmail.com', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
      { name: 'David', email: 'david@gmail.com', avatar: 'https://randomuser.me/api/portraits/men/4.jpg' },
      { name: 'Eve', email: 'eve@gmail.com', avatar: 'https://randomuser.me/api/portraits/women/5.jpg' }
    ],
    topics: [
      { title: 'Intro to AI', description: 'Basics of Artificial Intelligence', createdBy: 'Alice', date: '2024-06-12' },
      { title: 'ML Algorithms', description: 'Discussion on ML algorithms', createdBy: 'Bob', date: '2024-06-11' },
    ]
  },
  {
    name: 'Math Wizards',
    id: '2345678901234567',
    admins: [
      { name: 'Frank', email: 'frank@gmail.com', avatar: 'https://randomuser.me/api/portraits/men/6.jpg' }
    ],
    members: [
      { name: 'Grace', email: 'grace@gmail.com', avatar: 'https://randomuser.me/api/portraits/women/7.jpg' },
      { name: 'Heidi', email: 'heidi@gmail.com', avatar: 'https://randomuser.me/api/portraits/women/8.jpg' },
      { name: 'Ivan', email: 'ivan@gmail.com', avatar: 'https://randomuser.me/api/portraits/men/9.jpg' }
    ],
    topics: [
      { title: 'Calculus', description: 'Limits, derivatives, and integrals', createdBy: 'Frank', date: '2024-06-10' },
      { title: 'Algebra', description: 'Linear equations and more', createdBy: 'Grace', date: '2024-06-09' },
    ]
  },
];
const dummyPending = [
  { name: 'Physics Enthusiasts', id: '3456789012345678', requested: true }
];

function randomPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < 16; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

const Rooms = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('rooms'); // rooms | topics | chat
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [rooms, setRooms] = useState(dummyRooms);
  const [pending, setPending] = useState(dummyPending);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinRoomPass, setJoinRoomPass] = useState('');
  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: 'Welcome to the topic group chat!', isUser: false }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showParticipants, setShowParticipants] = useState(true);
  const [memberAction, setMemberAction] = useState({ show: false, user: null, anchor: null });
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [showRoomMenu, setShowRoomMenu] = useState(null); // To control which room's menu is open
  const [showTopicMenu, setShowTopicMenu] = useState(null); // To control which topic's menu is open
  const [showCreateTopicForm, setShowCreateTopicForm] = useState(false); // To control topic creation modal
  const [showAuthError, setShowAuthError] = useState(false); // For authorization error message
  const [adminLeavePrompt, setAdminLeavePrompt] = useState(false); // For admin leave room prompt
  const [leavingRoomId, setLeavingRoomId] = useState(null); // To store the room ID when admin tries to leave
  const [roomChatMessages, setRoomChatMessages] = useState({}); // Stores chat messages for each topic
  // Simulate current user
  const currentUser = { name: 'Alice', email: 'alice@gmail.com', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' };

  // Alphabetical member list
  const memberList = selectedRoom ? [...selectedRoom.members].sort() : [];

  // Helper: check if current user is admin in a room
  const isAdmin = (room) => room.admins.some(a => a.email === currentUser.email);

  // Helper: get sorted admins and members
  const getSortedAdmins = (room) => [...room.admins].sort((a, b) => a.name.localeCompare(b.name));
  const getSortedMembers = (room) => [...room.members].sort((a, b) => a.name.localeCompare(b.name));

  // Handlers
  const handleEnterRoom = (room) => {
    setSelectedRoom(room);
    setView('topics');
  };
  const handleBackToRooms = () => {
    setSelectedRoom(null);
    setView('rooms');
  };
  const handleBackToTopics = () => {
  setSelectedTopic(null);
  setView('topics');
  };
  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    setView('chat');
    // Load chat messages for this topic, or initialize if new
    if (!roomChatMessages[topic.title]) {
      setRoomChatMessages(prev => ({
        ...prev,
        [topic.title]: [{ id: 1, text: `Welcome to the topic: ${topic.title}!`, isUser: false, sender: 'AI', avatar: '/ai_logo.png', time: new Date().toLocaleTimeString() }]
      }));
    }
    setChatInput(''); // Clear input on topic change
  };
  // Create room
  const handleCreateRoom = () => {
    const id = String(Math.floor(1000000000000000 + Math.random() * 9000000000000000));
    const pass = randomPassword();
    setRooms([...rooms, { name: newRoomName, id, members: ['You'], topics: [] }]);
    setShowCreate(false);
    setNewRoomName('');
  };
  // Join room
  const handleJoinRoom = () => {
    // Simulate: if id matches any dummy room, add to pending
    const found = rooms.find(r => r.id === joinRoomId);
    if (found && joinRoomPass.length === 16) {
      setPending([...pending, { name: found.name, id: found.id, requested: true }]);
      setShowJoin(false);
      setJoinRoomId('');
      setJoinRoomPass('');
    } else {
      alert('Invalid room credentials');
    }
  };
  // Chat send
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const newMessage = { id: (roomChatMessages[selectedTopic.title]?.length || 0) + 1, text: chatInput, isUser: true, sender: currentUser.name, avatar: currentUser.avatar, time: new Date().toLocaleTimeString() };
    
    setRoomChatMessages(prev => ({
      ...prev,
      [selectedTopic.title]: [...(prev[selectedTopic.title] || []), newMessage]
    }));
    setChatInput('');

    if (chatInput.toLowerCase().includes('@chatbot')) {
      setTimeout(() => {
        const aiResponse = { id: (roomChatMessages[selectedTopic.title]?.length || 0) + 2, text: "AI: I'm here to help your group!", isUser: false, sender: 'AI', avatar: '/ai_logo.png', time: new Date().toLocaleTimeString() };
        setRoomChatMessages(prev => ({
          ...prev,
          [selectedTopic.title]: [...(prev[selectedTopic.title] || []), aiResponse]
        }));
      }, 1000);
    }
  };
  // Leave room
  const handleLeaveRoom = (roomId) => {
    const roomToLeave = rooms.find(r => r.id === roomId);
    if (isAdmin(roomToLeave) && roomToLeave.admins.length === 1) {
      // Admin is trying to leave and is the only admin
      setLeavingRoomId(roomId);
      setAdminLeavePrompt(true);
      return;
    }
    setRooms(rooms.filter(r => r.id !== roomId));
    setSelectedRoom(null); // Go back to rooms view
    setView('rooms');
    setShowRoomMenu(null); // Close menu
  };
  // Delete room (admin only)
  const handleDeleteRoom = (roomId) => {
    setRooms(rooms.filter(r => r.id !== roomId));
    setSelectedRoom(null); // Go back to rooms view
    setView('rooms');
    setShowRoomMenu(null); // Close menu
  };
  // Create topic
  const handleCreateTopic = () => {
    if (!newTopicTitle.trim()) return;
    setRooms(rooms.map(r => {
      if (r.id === selectedRoom.id) {
        return {
          ...r,
          topics: [
            ...r.topics,
            { title: newTopicTitle, description: newTopicDesc, createdBy: currentUser.name, date: new Date().toISOString().slice(0,10) }
          ]
        };
      }
      return r;
    }));
    setSelectedRoom({
      ...selectedRoom,
      topics: [
        ...selectedRoom.topics,
        { title: newTopicTitle, description: newTopicDesc, createdBy: currentUser.name, date: new Date().toISOString().slice(0,10) }
      ]
    });
    setNewTopicTitle('');
    setNewTopicDesc('');
  };
  // Delete topic
  const handleDeleteTopic = (topic) => {
    // Check if the current user is an admin of the room or the creator of the topic
    if (!isAdmin(selectedRoom) && topic.createdBy !== currentUser.name) {
      setShowAuthError(true);
      return;
    }

    setRooms(rooms.map(r => {
      if (r.id === selectedRoom.id) {
        return {
          ...r,
          topics: r.topics.filter(t => t.title !== topic.title)
        };
      }
      return r;
    }));
    setSelectedRoom({
      ...selectedRoom,
      topics: selectedRoom.topics.filter(t => t.title !== topic.title)
    });
    setShowTopicMenu(null); // Close menu after deletion
  };
  // Member actions
  const handleRemoveUser = (user) => {
    setRooms(rooms.map(r => {
      if (r.id === selectedRoom.id) {
        return {
          ...r,
          members: r.members.filter(m => m.email !== user.email),
          admins: r.admins.filter(a => a.email !== user.email)
        };
      }
      return r;
    }));
    setSelectedRoom({
      ...selectedRoom,
      members: selectedRoom.members.filter(m => m.email !== user.email),
      admins: selectedRoom.admins.filter(a => a.email !== user.email)
    });
    setMemberAction({ show: false, user: null, anchor: null });
  };
  const handleMakeAdmin = (user) => {
    setRooms(rooms.map(r => {
      if (r.id === selectedRoom.id) {
        return {
          ...r,
          admins: [...r.admins, user],
          members: r.members.filter(m => m.email !== user.email)
        };
      }
      return r;
    }));
    setSelectedRoom({
      ...selectedRoom,
      admins: [...selectedRoom.admins, user],
      members: selectedRoom.members.filter(m => m.email !== user.email)
    });
    setMemberAction({ show: false, user: null, anchor: null });
  };

  const handleDeleteChat = () => {
    if (window.confirm('Are you sure you want to delete this chat conversation?')) {
      setRoomChatMessages(prev => ({
        ...prev,
        [selectedTopic.title]: []
      }));
    }
  };

  // Main render
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
                  <DeleteChatButton onClick={handleDeleteChat}><FaTrash /> Delete Conversation</DeleteChatButton>
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
                      {(isAdmin(selectedRoom) || topic.createdBy === currentUser.name) && (
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
        <SectionTitle>Pending Rooms</SectionTitle>
        <RoomList>
          {pending.map(room => (
            <RoomBox key={room.id}>
              <div style={{fontWeight:700,marginBottom:6}}><FaClock style={{marginRight: 8}} />{room.name}</div>
              <RoomMeta>ID: {room.id}</RoomMeta>
              <RoomMeta>Status: Pending Approval</RoomMeta>
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