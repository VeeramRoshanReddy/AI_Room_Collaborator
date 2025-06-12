import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaUsers,
  FaBook,
  FaCog,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

const SidebarContainer = styled(motion.div)`
  background: ${props => props.theme.colors.surface};
  height: calc(100vh - 64px);
  position: fixed;
  top: 64px;
  left: 0;
  width: ${props => props.isOpen ? '240px' : '64px'};
  transition: width ${props => props.theme.transitions.default};
  box-shadow: ${props => props.theme.shadows.medium};
  z-index: 900;
  display: flex;
  flex-direction: column;
`;

const ToggleButton = styled(motion.button)`
  position: absolute;
  right: -12px;
  top: 20px;
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: ${props => props.theme.shadows.small};
  
  &:hover {
    background: ${props => props.theme.colors.secondary};
  }
`;

const NavSection = styled.div`
  padding: 24px 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NavItem = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 12px ${props => props.isOpen ? '24px' : '20px'};
  color: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.text};
  cursor: pointer;
  position: relative;
  transition: all ${props => props.theme.transitions.default};
  
  &:hover {
    background: rgba(37, 99, 235, 0.1);
    color: ${props => props.theme.colors.primary};
  }
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${props => props.isActive ? props.theme.colors.primary : 'transparent'};
    transition: background ${props => props.theme.transitions.default};
  }
`;

const NavIcon = styled.div`
  font-size: 20px;
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NavLabel = styled(motion.span)`
  margin-left: 12px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  opacity: ${props => props.isOpen ? 1 : 0};
`;

const BottomSection = styled.div`
  padding: 16px;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: ${props => props.theme.borderRadius.medium};
  background: rgba(37, 99, 235, 0.05);
  margin-bottom: 16px;
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserRole = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textLight};
`;

const navItems = [
  { icon: <FaHome />, label: 'Dashboard', path: '/dashboard' },
  { icon: <FaUsers />, label: 'Rooms', path: '/rooms' },
  { icon: <FaBook />, label: 'Personal Work', path: '/personal-work' },
  { icon: <FaCog />, label: 'Settings', path: '/settings' },
];

const Sidebar = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SidebarContainer
      isOpen={isOpen}
      initial={false}
      animate={{ width: isOpen ? 240 : 64 }}
    >
      <ToggleButton
        onClick={onToggle}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </ToggleButton>

      <NavSection>
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            isOpen={isOpen}
            isActive={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <NavIcon>{item.icon}</NavIcon>
            <AnimatePresence>
              {isOpen && (
                <NavLabel
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </NavLabel>
              )}
            </AnimatePresence>
          </NavItem>
        ))}
      </NavSection>

      <BottomSection>
        <UserInfo>
          <UserAvatar>VR</UserAvatar>
          <AnimatePresence>
            {isOpen && (
              <UserDetails
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <UserName>Veeram Roshan</UserName>
                <UserRole>Student</UserRole>
              </UserDetails>
            )}
          </AnimatePresence>
        </UserInfo>
      </BottomSection>
    </SidebarContainer>
  );
};

export default Sidebar; 