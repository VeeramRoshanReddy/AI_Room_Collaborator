import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaGraduationCap } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUserContext } from '../../context/UserContext';

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

// Construct API_BASE URL properly
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Use UserContext
  const { user, loading, isAuthenticated, refreshUser } = useUserContext();
  
  // Show error if redirected back with error param
  const params = new URLSearchParams(location.search);
  const error = params.get('error');
  const success = params.get('success');

  useEffect(() => {
    // If user is already authenticated (from context), redirect to dashboard
    if (!loading && isAuthenticated) {
      console.log('User already authenticated from context:', user);
      navigate('/dashboard');
      return;
    }

    // Check for successful login callback
    if (success === 'true') {
      console.log('Login success detected, refreshing user data...');
      // Refresh user data after successful OAuth callback
      refreshUser();
      // Remove success param from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [loading, isAuthenticated, user, navigate, success, refreshUser]);

  // Redirect to dashboard once user data is loaded after successful login
  useEffect(() => {
    if (!loading && isAuthenticated && success === 'true') {
      navigate('/dashboard');
    }
  }, [loading, isAuthenticated, navigate, success]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    try {
      console.log('Redirecting to Google login...');
      const loginUrl = `${API_BASE}/api/auth/google/login`;
      console.log('Login URL:', loginUrl);
      window.location.href = loginUrl;
    } catch (err) {
      console.error('Login redirect failed:', err);
      setIsLoading(false);
      toast.error('Failed to redirect to Google login');
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

  // Show loading if context is still loading
  if (loading) {
    return (
      <LoginContainer>
        <LoginCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>Loading...</div>
        </LoginCard>
      </LoginContainer>
    );
  }

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
          <GoogleButton onClick={handleGoogleLogin} disabled={isLoading || loading}>
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
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;