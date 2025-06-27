import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaUsers, FaFileAlt, FaComments, FaChartLine, FaClock, FaStar, FaArrowRight } from 'react-icons/fa';
import { useUserContext } from '../../context/UserContext';
import { toast } from 'react-toastify';

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
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalNotes: 0,
    totalChats: 0,
    recentActivity: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fetch user stats
      // const statsResponse = await makeAuthenticatedRequest('/api/v1/users/stats');
      // const statsData = await statsResponse.json();
      // setStats(statsData);

      // Fetch recent activities
      // const activitiesResponse = await makeAuthenticatedRequest('/api/v1/users/recent-activities');
      // const activitiesData = await activitiesResponse.json();
      // setRecentActivities(activitiesData.activities || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default stats if API fails
      setStats({
        totalRooms: 0,
        totalNotes: 0,
        totalChats: 0,
        recentActivity: 0
      });
      setRecentActivities([]);
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
        window.location.href = '/personal-work';
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
              <StatValue>Active rooms</StatValue>
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
            <StatIcon type="chats">
              <FaComments />
            </StatIcon>
            <StatContent>
              <StatTitle>Chat Messages</StatTitle>
              <StatValue>Total messages</StatValue>
            </StatContent>
          </StatHeader>
          <StatNumber>{stats.totalChats || 0}</StatNumber>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon type="activity">
              <FaChartLine />
            </StatIcon>
            <StatContent>
              <StatTitle>Activity</StatTitle>
              <StatValue>This week</StatValue>
            </StatContent>
          </StatHeader>
          <StatNumber>{stats.recentActivity || 0}</StatNumber>
        </StatCard>
      </StatsGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <Section>
          <SectionTitle>
            <FaClock />
            Recent Activity
          </SectionTitle>
          
          {recentActivities.length === 0 ? (
            <EmptyState>
              <FaClock size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p>No recent activity</p>
            </EmptyState>
          ) : (
            <RecentActivity>
              {recentActivities.slice(0, 5).map((activity, index) => (
                <ActivityItem key={index}>
                  <ActivityIcon type={getActivityType(activity.type)}>
                    {getActivityIcon(activity.type)}
                  </ActivityIcon>
                  <ActivityContent>
                    <ActivityTitle>{activity.description}</ActivityTitle>
                    <ActivityTime>{formatDate(activity.timestamp)}</ActivityTime>
                  </ActivityContent>
                </ActivityItem>
              ))}
            </RecentActivity>
          )}
        </Section>

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
      </div>
    </Container>
  );
};

export default Home; 