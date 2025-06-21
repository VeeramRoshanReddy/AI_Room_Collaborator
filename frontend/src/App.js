import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserProvider, useUserContext } from './context/UserContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Login from './components/auth/Login';
import Home from './components/personalwork/Home';
import Rooms from './components/personalwork/Rooms';
import PersonalWork from './components/personalwork/PersonalWork';

// Theme configuration
const theme = {
  colors: {
    primary: '#2563eb',
    secondary: '#1d4ed8',
    accent: '#06b6d4',
    background: '#f3f6fd',
    surface: '#f8fafc',
    text: '#1e293b',
    textLight: '#64748b',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#e2e8f0',
  },
  shadows: {
    small: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    medium: '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
    large: '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
  },
  transitions: {
    default: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  borderRadius: {
    small: '6px',
    medium: '12px',
    large: '18px',
  },
};

// Styled components
const AppContainer = styled.div`
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  background: #c0c0c0;
  color: ${props => props.theme.colors.text};
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  overflow: hidden;
`;

const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  margin-left: ${props => props.isSidebarOpen ? '220px' : '60px'};
  margin-top: 64px;
  transition: margin-left ${props => props.theme.transitions.default};
  padding: 24px;
  background: ${props => props.theme.colors.background};
  overflow-y: auto;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 16px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: ${props => props.theme.colors.background};
  font-size: 18px;
  color: ${props => props.theme.colors.text};
`;

// Placeholder components
const Dashboard = () => (
  <div style={{ padding: '20px' }}>
    <h1>Dashboard</h1>
    <p>Welcome to your dashboard!</p>
  </div>
);

const Settings = () => (
  <div style={{ padding: '20px' }}>
    <h1>Settings</h1>
    <p>Manage your settings here.</p>
  </div>
);

// Main App Component that uses UserContext
function AppContent() {
  const { user, loading, logout } = useUserContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isAuthenticated = !!user;

  // Handle logout
  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <LoadingContainer>
        <div>Loading...</div>
      </LoadingContainer>
    );
  }

  return (
    <AppContainer>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {isAuthenticated ? (
        <>
          <Navbar 
            user={user} 
            onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
            onLogout={handleLogout} 
          />
          <Sidebar 
            isOpen={isSidebarOpen} 
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          />
          <MainContent isSidebarOpen={isSidebarOpen}>
            <Routes>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/personalwork" element={<PersonalWork />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainContent>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </AppContainer>
  );
}

// Root App Component with Providers
function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;