import React, { useState } from 'react';
import styled from 'styled-components';
import { FaPlus, FaSignInAlt, FaUsers, FaClock, FaArrowLeft, FaCommentDots } from 'react-icons/fa';

const NoScrollWrapper = styled.div`
  height: 100vh;
  width: 100vw;
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
`;

const TwoColumn = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
`;

const MainArea = styled.div`
  flex: 0 0 80%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: #f8fafc;
  border-radius: 14px 0 0 14px;
  margin-top: 0;
  margin-bottom: 0;
  margin-left: 0;
  margin-right: 0;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.10);
  position: relative;
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
  &:hover {
    box-shadow: 0 8px 32px rgba(37, 99, 235, 0.18);
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
  margin-bottom: 16px;
  padding-right: 8px;
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
  gap: 10px;
  margin-bottom: 12px;
  align-items: flex-end;
  flex-direction: ${props => props.isUser ? 'row-reverse' : 'row'};
`;

const MessageContent = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 8px;
  background: ${props => props.isUser ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' : '#e0e7ef'};
  color: ${props => props.isUser ? 'white' : '#1e293b'};
  font-size: 15px;
  line-height: 1.5;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.isUser ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' : '#e0e7ef'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isUser ? 'white' : '#3b82f6'};
  font-size: 18px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #2563eb;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 2;
  cursor: pointer;
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

// Dummy data
const dummyRooms = [
  { name: 'AI Study Group', id: '1234567890123456', members: ['Alice', 'Bob', 'Charlie', 'David', 'Eve'], topics: [
    { title: 'Intro to AI', description: 'Basics of Artificial Intelligence', createdBy: 'Alice', date: '2024-06-12' },
    { title: 'ML Algorithms', description: 'Discussion on ML algorithms', createdBy: 'Bob', date: '2024-06-11' },
  ] },
  { name: 'Math Wizards', id: '2345678901234567', members: ['Frank', 'Grace', 'Heidi', 'Ivan'], topics: [
    { title: 'Calculus', description: 'Limits, derivatives, and integrals', createdBy: 'Frank', date: '2024-06-10' },
    { title: 'Algebra', description: 'Linear equations and more', createdBy: 'Grace', date: '2024-06-09' },
  ] },
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

  // Alphabetical member list
  const memberList = selectedRoom ? [...selectedRoom.members].sort() : [];

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
    setChatMessages([
      { id: 1, text: `Welcome to the topic: ${topic.title}!`, isUser: false }
    ]);
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
    setChatMessages(prev => [...prev, { id: prev.length + 1, text: chatInput, isUser: true }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { id: prev.length + 2, text: "AI: I'm here to help your group!", isUser: false }]);
    }, 1000);
  };

  // Main render
  if (view === 'chat') {
    return (
      <NoScrollWrapper>
        <TwoColumn>
          <MainArea>
            <BackButton onClick={handleBackToTopics}><FaArrowLeft /></BackButton>
            <SectionTitle style={{textAlign:'center',marginTop:32}}>{selectedTopic.title}</SectionTitle>
            <ChatArea style={{margin:'32px auto 0 auto',width:'90%',height:'80%'}}>
              <ChatMessages>
                {chatMessages.map(msg => (
                  <Message key={msg.id} isUser={msg.isUser}>
                    <Avatar isUser={msg.isUser}>{msg.isUser ? 'U' : <FaCommentDots />}</Avatar>
                    <MessageContent isUser={msg.isUser}>{msg.text}</MessageContent>
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
          <MemberList>
            <MemberTitle>Members</MemberTitle>
            {memberList.map(name => <MemberName key={name}><FaUsers /> {name}</MemberName>)}
          </MemberList>
        </TwoColumn>
      </NoScrollWrapper>
    );
  }
  if (view === 'topics') {
    return (
      <NoScrollWrapper>
        <TwoColumn>
          <MainArea>
            <BackButton onClick={handleBackToRooms}><FaArrowLeft /></BackButton>
            <SectionTitle style={{textAlign:'center',marginTop:32}}>Topics in {selectedRoom.name}</SectionTitle>
            <TopicList style={{margin:'32px auto 0 auto',width:'90%'}}>
              {selectedRoom.topics.map(topic => (
                <TopicBox key={topic.title} onClick={() => handleTopicClick(topic)}>
                  <TopicTitle>{topic.title}</TopicTitle>
                  <TopicMeta>{topic.description}</TopicMeta>
                  <TopicMeta>Created by {topic.createdBy} on {topic.date}</TopicMeta>
                </TopicBox>
              ))}
            </TopicList>
          </MainArea>
          <MemberList>
            <MemberTitle>Members</MemberTitle>
            {memberList.map(name => <MemberName key={name}><FaUsers /> {name}</MemberName>)}
          </MemberList>
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
              <div style={{fontWeight:700,marginBottom:6}}><FaUsers style={{marginRight: 8}} />{room.name}</div>
              <RoomMeta>ID: {room.id}</RoomMeta>
              <RoomMeta>Members: {room.members.length}</RoomMeta>
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
        <FormOverlay>
          <FormBox>
            <FormTitle>Create New Room</FormTitle>
            <FormInput
              placeholder="Room Name"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
            />
            <FormButton onClick={handleCreateRoom}>Create</FormButton>
            <FormButton style={{background:'#e0e7ef',color:'#2563eb'}} onClick={()=>setShowCreate(false)}>Cancel</FormButton>
          </FormBox>
        </FormOverlay>
      )}
      {showJoin && (
        <FormOverlay>
          <FormBox>
            <FormTitle>Join Room</FormTitle>
            <FormInput
              placeholder="Room ID (16 digits)"
              value={joinRoomId}
              onChange={e => setJoinRoomId(e.target.value)}
              maxLength={16}
            />
            <FormInput
              placeholder="Room Password (16 chars)"
              value={joinRoomPass}
              onChange={e => setJoinRoomPass(e.target.value)}
              maxLength={16}
            />
            <FormButton onClick={handleJoinRoom}>Request to Join</FormButton>
            <FormButton style={{background:'#e0e7ef',color:'#2563eb'}} onClick={()=>setShowJoin(false)}>Cancel</FormButton>
          </FormBox>
        </FormOverlay>
      )}
    </NoScrollWrapper>
  );
};

export default Rooms; 