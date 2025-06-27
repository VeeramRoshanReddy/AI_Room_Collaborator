import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaUsers, FaBook } from 'react-icons/fa';

const SidebarContainer = styled(motion.div)`
  background: linear-gradient(180deg, rgba(29,78,216,0.9) 0%, rgba(37,99,235,0.9) 100%, #fff 10%);
  height: calc(100vh - 64px);
  position: fixed;
  top: 64px;
  left: 0;
  width: ${props => props.isOpen ? '160px' : '60px'};
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.10);
  z-index: 900;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  font-family: 'Poppins', 'Inter', 'Montserrat', sans-serif;
`;

const NavSection = styled.div`
  padding: 32px 0 0 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const NavItem = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 14px ${props => props.isOpen ? '28px' : '18px'};
  color: ${props => props.isActive ? '#fff' : 'rgba(255,255,255,0.85)'};
  cursor: pointer;
  position: relative;
  border-radius: 12px;
  margin: 0 8px;
  font-weight: 500;
  font-size: 16px;
  background: ${props => props.isActive ? 'rgba(255,255,255,0.10)' : 'transparent'};
  transition: all 0.2s;
  &:hover {
    background: rgba(255,255,255,0.12);
    color: #fff;
  }
`;

const NavIcon = styled.div`
  font-size: 22px;
  min-width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NavLabel = styled(motion.span)`
  margin-left: 14px;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  opacity: ${props => props.isOpen ? 1 : 0};
`;

const BottomSection = styled.div`
  padding: 18px 0 18px 0;
  border-top: 1px solid rgba(255,255,255,0.10);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  border-radius: 12px;
  background: rgba(255,255,255,0.10);
  margin: 0 12px;
  margin-bottom: 10px;
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-weight: 700;
  font-size: 18px;
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserRole = styled.div`
  font-size: 13px;
  color: #e0e7ef;
`;

const navItems = [
  { icon: <FaHome />, label: 'Home', path: '/dashboard' },
  { icon: <FaUsers />, label: 'Rooms', path: '/rooms' },
  { icon: <FaBook />, label: 'Notes', path: '/notes' },
];

const Sidebar = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <SidebarContainer
      isOpen={isOpen}
      initial={false}
      animate={{ width: isOpen ? 160 : 60 }}
    >
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
    </SidebarContainer>
  );
};

export default Sidebar; 