import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import styled, { ThemeProvider } from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Login from './components/auth/Login';
import Home from './components/personalwork/Home';
import Rooms from './components/personalwork/Rooms';
import PersonalWork from './components/personalwork/PersonalWork';

// Theme configuration
const theme = {
  colors: {
    primary: '#2563eb', // Modern blue
    secondary: '#1d4ed8',
    accent: '#06b6d4', // Cyan
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
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e9ed 100%), url('https://www.transparenttextures.com/patterns/cubes.png'); /* Grey background */
  background-blend-mode: lighten;
  color: ${props => props.theme.colors.text};
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  overflow: hidden;
`;

const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  min-height: 0; /* Reverted to original */
  margin-left: ${props => props.isSidebarOpen ? '220px' : '60px'};
  margin-top: 64px;
  transition: margin-left ${props => props.theme.transitions.default};
  padding: 24px;
  background: transparent; /* Reverted to original */
  overflow-y: auto;
`;

// Placeholder components (to be implemented)
const Dashboard = () => <div>Dashboard Component</div>;
const Settings = () => <div>Settings Component</div>;

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!user); // Derive isAuthenticated immediately
  const [loadingAuth, setLoadingAuth] = useState(false); // No longer need loading state if isAuthenticated is immediate
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // No longer need this useEffect to set isAuthenticated and loadingAuth if done synchronously
  /*
  useEffect(() => {
    setIsAuthenticated(!!user);
    setLoadingAuth(false);
  }, [user]);
  */

  const handleLogout = () => {
    // Clear Google session (for Google One Tap/automatic sign-in)
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    
    // Clear local storage
    localStorage.removeItem('user');
    
    setUser(null); // Set user to null to trigger isAuthenticated update
  };

  // Google OAuth Client ID for production
  const GOOGLE_CLIENT_ID = '290635245122-a60ie2u5b8ga1lklu79tktgecs3s7l6c.apps.googleusercontent.com';

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
                  onLogout={handleLogout}
                />
                <Sidebar 
                  isOpen={isSidebarOpen}
                  onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                />
                <MainContent isSidebarOpen={isSidebarOpen}>
                  <ThemeProvider theme={theme}>
                    <Routes>
                      <Route path="/dashboard" element={<Home />} />
                      <Route path="/rooms" element={<Rooms />} />
                      <Route path="/personalwork" element={<PersonalWork />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </ThemeProvider>
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
