import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaBars, 
  FaBell, 
  FaSignOutAlt,
  FaUserCircle 
} from 'react-icons/fa';

const NavbarContainer = styled.nav`
  height: 64px;
  background: ${props => props.theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: ${props => props.theme.shadows.medium};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ToggleButton = styled(motion.button)`
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${props => props.theme.borderRadius.small};
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  span {
    font-size: 14px;
    font-weight: 400;
    opacity: 0.8;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const IconButton = styled(motion.button)`
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${props => props.theme.borderRadius.small};
  position: relative;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  background: ${props => props.theme.colors.error};
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 10px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.medium};
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const UserImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
`;

const UserName = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const Navbar = ({ user, onSidebarToggle }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = React.useState(3); // Example notification count

  const handleLogout = () => {
    // Implement logout logic here
    navigate('/login');
  };

  return (
    <NavbarContainer>
      <LeftSection>
        <ToggleButton
          onClick={onSidebarToggle}
          whileTap={{ scale: 0.95 }}
        >
          <FaBars />
        </ToggleButton>
        <Logo onClick={() => navigate('/dashboard')}>
          AI Learning Platform
          <span>Beta</span>
        </Logo>
      </LeftSection>

      <RightSection>
        <IconButton
          whileTap={{ scale: 0.95 }}
          onClick={() => {/* Handle notifications */}}
        >
          <FaBell />
          {notifications > 0 && (
            <NotificationBadge>{notifications}</NotificationBadge>
          )}
        </IconButton>

        <UserProfile onClick={() => {/* Handle profile menu */}}>
          {user?.picture ? (
            <UserImage src={user.picture} alt={user.name} />
          ) : (
            <FaUserCircle size={32} />
          )}
          <UserName>{user?.name || 'User'}</UserName>
        </UserProfile>

        <IconButton
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
        >
          <FaSignOutAlt />
        </IconButton>
      </RightSection>
    </NavbarContainer>
  );
};

export default Navbar; 