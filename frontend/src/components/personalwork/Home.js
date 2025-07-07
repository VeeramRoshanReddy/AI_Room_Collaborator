import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaUsers, FaFileAlt, FaComments, FaChartLine, FaClock, FaStar, FaArrowRight } from 'react-icons/fa';
import { useUserContext } from '../../context/UserContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const WelcomeTitle = styled.h1`
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
`;

const UserInfo = styled.div`
  color: #64748b;
  font-size: 1.1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  background: ${props => {
    switch (props.type) {
      case 'rooms': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'notes': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'chats': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'activity': return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatTitle = styled.h3`
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
`;

const StatValue = styled.div`
  color: #64748b;
  font-size: 0.9rem;
`;

const StatNumber = styled.div`
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin-top: 8px;
`;

const Section = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h2`
  color: #1e293b;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RecentActivity = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  transition: background 0.2s;
  
  &:hover {
    background: #f1f5f9;
  }
`;

const ActivityIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: white;
  background: ${props => {
    switch (props.type) {
      case 'room': return '#667eea';
      case 'note': return '#f5576c';
      case 'chat': return '#4facfe';
      default: return '#667eea';
    }
  }};
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  color: #1e293b;
  font-weight: 500;
  font-size: 0.9rem;
`;

const ActivityTime = styled.div`
  color: #64748b;
  font-size: 0.8rem;
  margin-top: 2px;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
`;

const ActionCard = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
  
  &:hover {
    background: #f1f5f9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ActionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const ActionIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  background: ${props => {
    switch (props.type) {
      case 'create-room': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'upload-note': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'join-room': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'view-notes': return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
`;

const ActionTitle = styled.h3`
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
`;

const ActionDescription = styled.p`
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
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

const Home = () => {
  const { makeAuthenticatedRequest, user } = useUserContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalNotes: 0,
  });
  const [userRooms, setUserRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's rooms
      const roomsRes = await makeAuthenticatedRequest('/rooms/my-rooms');
      let rooms = [];
      if (roomsRes.ok) {
        rooms = await roomsRes.json();
      }
      setUserRooms(rooms);
      setStats(prev => ({
        ...prev,
        totalRooms: rooms.length,
      }));
      // Optionally fetch notes count if needed
    } catch (error) {
      setStats({ totalRooms: 0, totalNotes: 0 });
      setUserRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickAction = (action) => {
    switch (action) {
      case 'create-room':
        window.location.href = '/rooms';
        break;
      case 'upload-note':
        window.location.href = '/personal-work';
        break;
      case 'join-room':
        window.location.href = '/rooms';
        break;
      case 'view-notes':
        window.location.href = '/notes';
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'room_created':
      case 'room_joined':
        return <FaUsers />;
      case 'note_created':
      case 'note_updated':
        return <FaFileAlt />;
      case 'chat_message':
        return <FaComments />;
      default:
        return <FaClock />;
    }
  };

  const getActivityType = (type) => {
    switch (type) {
      case 'room_created':
      case 'room_joined':
        return 'room';
      case 'note_created':
      case 'note_updated':
        return 'note';
      case 'chat_message':
        return 'chat';
      default:
        return 'activity';
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>Loading dashboard...</LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <WelcomeTitle>Welcome back, {user?.name || 'User'}!</WelcomeTitle>
          <UserInfo>Here's what's happening with your study sessions</UserInfo>
        </div>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatIcon type="rooms">
              <FaUsers />
            </StatIcon>
            <StatContent>
              <StatTitle>Study Rooms</StatTitle>
              <StatValue>Rooms you're a part of</StatValue>
            </StatContent>
          </StatHeader>
          <StatNumber>{stats.totalRooms || 0}</StatNumber>
        </StatCard>
        <StatCard>
          <StatHeader>
            <StatIcon type="notes">
              <FaFileAlt />
            </StatIcon>
            <StatContent>
              <StatTitle>Notes</StatTitle>
              <StatValue>Total notes</StatValue>
            </StatContent>
          </StatHeader>
          <StatNumber>{stats.totalNotes || 0}</StatNumber>
        </StatCard>
        <StatCard>
          <StatHeader>
            <StatIcon type="activity">
              <FaStar />
            </StatIcon>
            <StatContent>
              <StatTitle>Motivation</StatTitle>
              <StatValue>Keep up the great work!</StatValue>
            </StatContent>
          </StatHeader>
          <div style={{marginTop: 16}}>
            <div style={{fontWeight:600, color:'#2563eb', fontSize:'1.1rem'}}>You're making progress!</div>
            <div style={{background:'#e0e7ef', borderRadius:8, height:10, marginTop:8, width:'100%'}}>
              <div style={{width: `${Math.min(100, stats.totalRooms * 10)}%`, background:'#2563eb', height:10, borderRadius:8, transition:'width 0.5s'}}></div>
            </div>
          </div>
        </StatCard>
      </StatsGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Your Rooms Section */}
        <Section>
          <SectionTitle>
            <FaUsers />
            Your Rooms
          </SectionTitle>
          {userRooms.length === 0 ? (
            <EmptyState>
              <FaUsers size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p>You're not a member of any rooms yet.</p>
            </EmptyState>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              {userRooms.map(room => (
                <div key={room.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8fafc', borderRadius:10, padding:'14px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                  <div>
                    <div style={{fontWeight:600, color:'#2563eb', fontSize:'1.05rem'}}>{room.name}</div>
                    <div style={{fontSize:'0.92rem', color:'#64748b'}}>Room ID: <b>{room.room_id}</b></div>
                  </div>
                  <button style={{background:'#2563eb', color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', fontWeight:500, cursor:'pointer'}} onClick={() => navigate('/rooms')}>Enter</button>
                </div>
              ))}
            </div>
          )}
        </Section>
        {/* Motivation Section */}
        <Section>
          <SectionTitle>
            <FaStar />
            Motivation
          </SectionTitle>
          <div style={{fontSize:'1.1rem', color:'#374151', marginBottom:12}}>
            "Success is the sum of small efforts, repeated day in and day out."<br/>
            <span style={{fontSize:'0.95rem', color:'#64748b'}}>— Robert Collier</span>
          </div>
          <div style={{marginTop:18, color:'#2563eb', fontWeight:600, fontSize:'1.05rem'}}>Stay consistent and keep collaborating!</div>
        </Section>
      </div>
      {/* Quick Actions Section remains unchanged */}
      <Section>
        <SectionTitle>
          <FaStar />
          Quick Actions
        </SectionTitle>
        <QuickActions>
          <ActionCard onClick={() => handleQuickAction('create-room')}>
            <ActionHeader>
              <ActionIcon type="create-room">
                <FaUsers />
              </ActionIcon>
              <ActionTitle>Create Room</ActionTitle>
            </ActionHeader>
            <ActionDescription>
              Start a new study session with your peers
            </ActionDescription>
          </ActionCard>
          <ActionCard onClick={() => handleQuickAction('upload-note')}>
            <ActionHeader>
              <ActionIcon type="upload-note">
                <FaFileAlt />
              </ActionIcon>
              <ActionTitle>Upload Note</ActionTitle>
            </ActionHeader>
            <ActionDescription>
              Add a new document to your collection
            </ActionDescription>
          </ActionCard>
          <ActionCard onClick={() => handleQuickAction('join-room')}>
            <ActionHeader>
              <ActionIcon type="join-room">
                <FaUsers />
              </ActionIcon>
              <ActionTitle>Join Room</ActionTitle>
            </ActionHeader>
            <ActionDescription>
              Find and join existing study rooms
            </ActionDescription>
          </ActionCard>
          <ActionCard onClick={() => handleQuickAction('view-notes')}>
            <ActionHeader>
              <ActionIcon type="view-notes">
                <FaFileAlt />
              </ActionIcon>
              <ActionTitle>View Notes</ActionTitle>
            </ActionHeader>
            <ActionDescription>
              Browse and manage your notes
            </ActionDescription>
          </ActionCard>
        </QuickActions>
      </Section>
    </Container>
  );
};

export default Home; 