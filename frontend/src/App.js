import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUserContext } from './context/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/common/Spinner';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Login from './components/auth/Login';
import Home from './components/personalwork/Home';
import Rooms from './components/personalwork/Rooms';
import PersonalWork from './components/personalwork/PersonalWork';

const theme = {
  colors: {
    primary: '#4f46e5',
    secondary: '#2563eb',
    accent: '#06b6d4',
    background: '#f1f5f9',
    surface: '#ffffff',
    text: '#0f172a',
    textLight: '#64748b',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#e2e8f0',
  },
  shadows: {
    small: '0 1px 3px rgba(15,23,42,0.08)',
    medium: '0 8px 24px rgba(15,23,42,0.1)',
    large: '0 20px 40px rgba(15,23,42,0.12)',
  },
  transitions: {
    default: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  borderRadius: {
    small: '8px',
    medium: '14px',
    large: '20px',
  },
};

const AppContainer = styled.div`
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.text};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
`;

const AuthenticatedLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 72px);
  margin-left: ${(p) => (p.$sidebarOpen ? '220px' : '72px')};
  margin-top: 72px;
  transition: margin-left ${(p) => p.theme.transitions.default};
  padding: 24px;
  overflow-y: auto;

  @media (max-width: 768px) {
    margin-left: 0;
    padding: 16px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  height: 100vh;
  background: ${(p) => p.theme.colors.background};
  font-size: 1rem;
  color: ${(p) => p.theme.colors.textLight};
`;

const Settings = () => (
  <div style={{ padding: 8 }}>
    <h1 style={{ marginBottom: 8 }}>Settings</h1>
    <p style={{ color: '#64748b' }}>Account settings will be available here soon.</p>
  </div>
);

const AuthenticatedApp = ({ children }) => {
  const { user, logout } = useUserContext();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AuthenticatedLayout>
      <Navbar
        user={user}
        onSidebarToggle={() => setSidebarOpen((o) => !o)}
        onLogout={onLogout}
      />
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
      <MainContent $sidebarOpen={sidebarOpen}>{children}</MainContent>
    </AuthenticatedLayout>
  );
};

function AppContent() {
  const { loading } = useUserContext();

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
        Loading your workspace...
      </LoadingContainer>
    );
  }

  return (
    <AppContainer>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthenticatedApp>
                <Home />
              </AuthenticatedApp>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <AuthenticatedApp>
                <Rooms />
              </AuthenticatedApp>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personalwork"
          element={
            <ProtectedRoute>
              <AuthenticatedApp>
                <PersonalWork />
              </AuthenticatedApp>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AuthenticatedApp>
                <Settings />
              </AuthenticatedApp>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppContainer>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
