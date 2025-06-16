import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

const NavbarContainer = styled.nav`
  height: 64px;
  background: linear-gradient(90deg, rgba(29,78,216,0.9) 0%, rgba(37,99,235,0.9) 100%, #fff 10%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.10);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  border-radius: 0;
  font-family: 'Poppins', 'Inter', 'Montserrat', sans-serif;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const ToggleButton = styled(motion.button)`
  background: rgba(255,255,255,0.08);
  border: none;
  color: white;
  font-size: 22px;
  cursor: pointer;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.10);
  transition: background 0.2s;
  &:hover {
    background: rgba(255,255,255,0.18);
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;

  img {
    height: 40px;
    width: auto;
  }

  span {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 1px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    
    small {
      font-size: 13px;
      font-weight: 400;
      opacity: 0.8;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 6px 16px;
  border-radius: 12px;
  background: rgba(255,255,255,0.10);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.10);
  transition: background 0.2s;
  width: 180px;
  max-width: 180px;
  &:hover {
    background: rgba(255,255,255,0.18);
  }
`;

const UserImage = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
`;

const UserName = styled.span`
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  max-width: 120px;
`;

const IconButton = styled(motion.button)`
  background: rgba(255,255,255,0.08);
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.10);
  transition: background 0.2s;
  &:hover {
    background: rgba(255,255,255,0.18);
  }
`;

const Navbar = ({ user, onSidebarToggle, onLogout }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
  // This `onLogout` should trigger the actual Google logout (e.g., gapi.auth2.getAuthInstance().signOut())
  // This should be implemented in the parent component that provides the `onLogout` prop.
  if (onLogout) {
    onLogout();
  }
  // Remove the navigate call - let App.js handle the redirect
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
          <img src="/logo.png" alt="AI Room Collaborator Logo" />
          <span>
            AI Learning Platform
            <small>Collaborative Learning with AI</small>
          </span>
        </Logo>
      </LeftSection>
      <RightSection>
        <UserProfile>
          {user?.picture ? (
            <UserImage src={user.picture} alt={user.name || 'User'} />
          ) : (
            <FaUserCircle size={32} />
          )}
          <UserName title={user?.name || 'User'}>
            {user?.name || 'User'}
          </UserName>
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