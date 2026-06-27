import React, { useState } from 'react';
import styled from 'styled-components';
import { FaBars, FaSignOutAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const NavbarContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: ${(p) => p.theme.colors.surface};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;
  box-shadow: ${(p) => p.theme.shadows.small};
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const MenuButton = styled.button`
  background: #f1f5f9;
  border: none;
  font-size: 18px;
  color: ${(p) => p.theme.colors.text};
  cursor: pointer;
  padding: 10px;
  border-radius: 10px;
  &:hover {
    background: #e2e8f0;
  }
`;

const Logo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const LogoTitle = styled.span`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${(p) => p.theme.colors.primary};
`;

const LogoTag = styled.span`
  font-size: 0.75rem;
  color: ${(p) => p.theme.colors.textLight};
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
`;

const UserInfo = styled.div`
  text-align: right;
  @media (max-width: 768px) {
    display: none;
  }
`;

const UserName = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
`;

const UserEmail = styled.div`
  font-size: 0.75rem;
  color: ${(p) => p.theme.colors.textLight};
`;

const Avatar = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid ${(p) => p.theme.colors.border};
  background: linear-gradient(135deg, #4f46e5, #2563eb);
  color: white;
  font-weight: 700;
  cursor: pointer;
`;

const Dropdown = styled(motion.div)`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: 12px;
  box-shadow: ${(p) => p.theme.shadows.medium};
  min-width: 160px;
  overflow: hidden;
  z-index: 1001;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #dc2626;
  font-weight: 500;
  &:hover {
    background: #fef2f2;
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 999;
`;

const Navbar = ({ user, onSidebarToggle, onLogout }) => {
  const [open, setOpen] = useState(false);
  const initials = (user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <NavbarContainer>
      <LeftSection>
        <MenuButton onClick={onSidebarToggle} aria-label="Toggle sidebar">
          <FaBars />
        </MenuButton>
        <Logo>
          <LogoTitle>StudyBuddy</LogoTitle>
          <LogoTag>Collaborative learning with AI</LogoTag>
        </Logo>
      </LeftSection>

      <UserSection>
        <UserInfo>
          <UserName>{user?.name || 'User'}</UserName>
          <UserEmail>{user?.email || ''}</UserEmail>
        </UserInfo>
        <Avatar onClick={() => setOpen((o) => !o)}>{initials}</Avatar>
        <AnimatePresence>
          {open && (
            <>
              <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
              <Dropdown initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <DropdownItem
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                >
                  <FaSignOutAlt /> Logout
                </DropdownItem>
              </Dropdown>
            </>
          )}
        </AnimatePresence>
      </UserSection>
    </NavbarContainer>
  );
};

export default Navbar;
