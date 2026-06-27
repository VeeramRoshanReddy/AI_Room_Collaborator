import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaUsers, FaBook } from 'react-icons/fa';

const SidebarContainer = styled(motion.div)`
  background: linear-gradient(180deg, #1e1b4b 0%, #312e81 100%);
  height: calc(100vh - 72px);
  position: fixed;
  top: 72px;
  left: 0;
  width: ${(p) => (p.$isOpen ? '220px' : '72px')};
  transition: width 0.25s ease;
  box-shadow: 4px 0 24px rgba(15, 23, 42, 0.12);
  z-index: 900;
  display: flex;
  flex-direction: column;
  padding: 16px 10px;
`;

const NavSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const NavItem = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 12px ${(p) => (p.$isOpen ? '16px' : '12px')};
  color: ${(p) => (p.$active ? '#fff' : 'rgba(255,255,255,0.75)')};
  cursor: pointer;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  background: ${(p) => (p.$active ? 'rgba(255,255,255,0.14)' : 'transparent')};
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const NavIcon = styled.div`
  font-size: 1.15rem;
  min-width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NavLabel = styled(motion.span)`
  margin-left: 12px;
  white-space: nowrap;
`;

const navItems = [
  { icon: <FaHome />, label: 'Dashboard', path: '/dashboard' },
  { icon: <FaUsers />, label: 'Rooms', path: '/rooms' },
  { icon: <FaBook />, label: 'Notes', path: '/personalwork' },
];

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SidebarContainer $isOpen={isOpen} initial={false} animate={{ width: isOpen ? 220 : 72 }}>
      <NavSection>
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            $isOpen={isOpen}
            $active={location.pathname.startsWith(item.path)}
            onClick={() => navigate(item.path)}
            whileTap={{ scale: 0.98 }}
          >
            <NavIcon>{item.icon}</NavIcon>
            <AnimatePresence>
              {isOpen && (
                <NavLabel initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
