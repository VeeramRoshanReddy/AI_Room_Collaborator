import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaGraduationCap } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.colors.secondary} 100%);
  padding: 20px;
`;

const LoginCard = styled(motion.div)`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: 40px;
  width: 100%;
  max-width: 480px;
  box-shadow: ${props => props.theme.shadows.large};
  text-align: center;
`;

const Logo = styled.div`
  font-size: 48px;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h1`
  font-size: 32px;
  color: ${props => props.theme.colors.text};
  margin-bottom: 8px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: ${props => props.theme.colors.textLight};
  margin-bottom: 32px;
`;

const GoogleButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 24px;
`;

const GoogleButton = styled.button`
  background: #4285f4;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(66, 133, 244, 0.15);
  transition: background 0.2s;
  &:hover {
    background: #2563eb;
  }
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const FeaturesList = styled.div`
  margin-top: 40px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  text-align: left;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  svg {
    color: ${props => props.theme.colors.primary};
    font-size: 20px;
  }
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #c53030;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  border: 1px solid #fed7d7;
  font-size: 14px;
`;

const DebugButton = styled.button`
  background: #718096;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 16px;
  &:hover {
    background: #4a5568;
  }
`;

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [debugInfo, setDebugInfo] = React.useState(null);
  
  // Show error if redirected back with error param
  const params = new URLSearchParams(location.search);
  const error = params.get('error');

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User already authenticated:', data);
        navigate('/dashboard');
      } else {
        console.log('User not authenticated:', response.status);
      }
    } catch (err) {
      console.log('Auth check failed:', err);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    try {
      window.location.href = `${API_BASE}/api/auth/google/login`;
    } catch (err) {
      console.error('Login redirect failed:', err);
      setIsLoading(false);
      toast.error('Failed to redirect to Google login');
    }
  };

  const handleDebugAuth = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/debug`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
        console.log('Debug info:', data);
      } else {
        console.error('Debug request failed:', response.status);
      }
    } catch (err) {
      console.error('Debug request error:', err);
    }
  };

  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      missing_code: 'Google login failed: Missing authorization code.',
      token_exchange_failed: 'Google login failed: Could not exchange code for token.',
      missing_access_token: 'Google login failed: Missing access token.',
      userinfo_failed: 'Google login failed: Could not fetch user info.',
      incomplete_profile: 'Google login failed: Incomplete profile information.',
      database_error: 'Login failed: Database error occurred.',
      network_error: 'Login failed: Network error occurred.',
      authentication_failed: 'Authentication failed. Please try again.',
      oauth_denied: 'Google login was cancelled or denied.',
      invalid_state: 'Login failed: Security validation failed.'
    };
    
    return errorMessages[errorCode] || 'Google login failed. Please try again.';
  };

  return (
    <LoginContainer>
      <LoginCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo>
          <FaGraduationCap />
        </Logo>
        <Title>AI Learning Platform</Title>
        <Subtitle>Your collaborative space for enhanced learning</Subtitle>
        
        {error && (
          <ErrorMessage>
            {getErrorMessage(error)}
          </ErrorMessage>
        )}
        
        <GoogleButtonContainer>
          <GoogleButton onClick={handleGoogleLogin} disabled={isLoading}>
            <img 
              src="/google_g_logo.png" 
              alt="Google Logo" 
              style={{ width: 24, height: 24 }} 
            />
            {isLoading ? 'Redirecting...' : 'Sign in with Google'}
          </GoogleButton>
        </GoogleButtonContainer>
        
        <FeaturesList>
          <FeatureItem>
            <FaGraduationCap />
            <span>AI-Powered Learning</span>
          </FeatureItem>
          <FeatureItem>
            <FaGraduationCap />
            <span>Real-time Collaboration</span>
          </FeatureItem>
          <FeatureItem>
            <FaGraduationCap />
            <span>Interactive Classrooms</span>
          </FeatureItem>
          <FeatureItem>
            <FaGraduationCap />
            <span>Smart Document Analysis</span>
          </FeatureItem>
        </FeaturesList>
        
        {/* Debug section - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <DebugButton onClick={handleDebugAuth}>
              Debug Auth
            </DebugButton>
            {debugInfo && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: '#f7fafc', 
                borderRadius: '6px',
                fontSize: '12px',
                textAlign: 'left',
                fontFamily: 'monospace'
              }}>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </>
        )}
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;