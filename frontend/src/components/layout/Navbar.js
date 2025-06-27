import React, { useState } from 'react';
import styled from 'styled-components';
import { FaBars, FaSignOutAlt, FaUser, FaCog } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const NavbarContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 86px;
  background: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;
  box-shadow: ${props => props.theme.shadows.small};
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
  
  &:hover {
    background: ${props => props.theme.colors.border};
  }
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const UserName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const UserEmail = styled.span`
  font-size: 12px;
  color: ${props => props.theme.colors.textLight};
`;

const ProfilePicture = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid ${props => props.theme.colors.border};
  transition: border-color 0.2s;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const DefaultAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid ${props => props.theme.colors.border};
  transition: border-color 0.2s;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => props.theme.shadows.medium};
  min-width: 200px;
  z-index: 1001;
  overflow: hidden;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  transition: background-color 0.2s;
  
  &:hover {
    background: ${props => props.theme.colors.border};
  }
  
  &:first-child {
    border-top-left-radius: ${props => props.theme.borderRadius.medium};
    border-top-right-radius: ${props => props.theme.borderRadius.medium};
  }
  
  &:last-child {
    border-bottom-left-radius: ${props => props.theme.borderRadius.medium};
    border-bottom-right-radius: ${props => props.theme.borderRadius.medium};
  }
`;

const LogoutButton = styled(DropdownItem)`
  color: ${props => props.theme.colors.error};
  
  &:hover {
    background: #fee;
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const Navbar = ({ user, onSidebarToggle, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleOverlayClick = () => {
    setShowDropdown(false);
  };

  const handleLogout = () => {
    setShowDropdown(false);
    onLogout();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <NavbarContainer>
      <LeftSection>
        <MenuButton onClick={onSidebarToggle}>
          <FaBars />
        </MenuButton>
        <Logo>
          <span>Room Connect</span>
          <span style={{ color: '#06b6d4' }}>Where Collaboration Meets Intelligence.</span>
        </Logo>
      </LeftSection>

      <RightSection>
        <UserSection>
          <UserInfo>
            <UserName>{user?.name || 'User'}</UserName>
            <UserEmail>{user?.email || 'user@example.com'}</UserEmail>
          </UserInfo>
          
          {user?.picture ? (
            <ProfilePicture
              src={user.picture}
              alt={user.name || 'Profile'}
              onClick={handleProfileClick}
            />
          ) : (
            <DefaultAvatar onClick={handleProfileClick}>
              {getInitials(user?.name)}
            </DefaultAvatar>
          )}

          <AnimatePresence>
            {showDropdown && (
              <>
                <Overlay
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleOverlayClick}
                />
                <DropdownMenu
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <LogoutButton onClick={handleLogout}>
                    <FaSignOutAlt size={14} />
                    Logout
                  </LogoutButton>
                </DropdownMenu>
              </>
            )}
          </AnimatePresence>
        </UserSection>
      </RightSection>
    </NavbarContainer>
  );
};

export default Navbar; 