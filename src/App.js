import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import styled, { ThemeProvider } from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Login from './components/auth/Login';

// Theme configuration
const theme = {
  colors: {
    primary: '#2563eb', // Modern blue
    secondary: '#4f46e5', // Indigo
    accent: '#06b6d4', // Cyan
    background: '#ffffff',
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
    default: '0.3s ease-in-out',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
  },
};

// Styled components
const AppContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
`;

const MainContent = styled.main`
  display: flex;
  min-height: calc(100vh - 64px);
  margin-left: ${props => props.isSidebarOpen ? '240px' : '64px'};
  transition: margin-left ${props => props.theme.transitions.default};
  padding: 24px;
  background: ${props => props.theme.colors.background};
`;

// Placeholder components (to be implemented)
const Dashboard = () => <div>Dashboard Component</div>;
const Rooms = () => <div>Rooms Component</div>;
const PersonalWork = () => <div>Personal/Work Component</div>;
const Settings = () => <div>Settings Component</div>;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  // Google OAuth Client ID - Replace with your actual client ID
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-client-id-here';

  return (
    <ThemeProvider theme={theme}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Router>
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
                />
                <Sidebar 
                  isOpen={isSidebarOpen}
                  onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                />
                <MainContent isSidebarOpen={isSidebarOpen}>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/rooms" element={<Rooms />} />
                    <Route path="/personal-work" element={<PersonalWork />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </MainContent>
              </>
            ) : (
              <Routes>
                <Route 
                  path="/login" 
                  element={
                    <Login 
                      onLogin={setIsAuthenticated} 
                      setUser={setUser} 
                    />
                  } 
                />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            )}
          </AppContainer>
        </Router>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

export default App;
