import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaUsers, FaFileAlt, FaStar } from 'react-icons/fa';
import { useUserContext } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import Spinner from '../common/Spinner';

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
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  height: 200px;
  color: #2563eb;
  font-size: 1.1rem;
`;

const Home = () => {
  const { makeAuthenticatedRequest, user } = useUserContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalNotes: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const roomsRes = await makeAuthenticatedRequest('/rooms/my-rooms');
      const rooms = await roomsRes.json();

      let notesCount = 0;
      try {
        const notesRes = await makeAuthenticatedRequest('/notes/my-notes');
        const notes = await notesRes.json();
        notesCount = Array.isArray(notes) ? notes.length : (notes.notes?.length || 0);
      } catch {
        notesCount = 0;
      }

      setStats({
        totalRooms: Array.isArray(rooms) ? rooms.length : 0,
        totalNotes: notesCount,
      });
    } catch {
      setStats({ totalRooms: 0, totalNotes: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Intentionally run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuickAction = (action) => {
    switch (action) {
      case 'create-room':
      case 'join-room':
        navigate('/rooms');
        break;
      case 'upload-note':
      case 'view-notes':
        navigate('/personalwork');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>
          <Spinner />
          Loading dashboard...
        </LoadingSpinner>
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
      </StatsGrid>
      <Section style={{boxShadow:'0 4px 24px rgba(37,99,235,0.07)', border:'2px solid #e0e8f0', marginTop: 24}}>
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