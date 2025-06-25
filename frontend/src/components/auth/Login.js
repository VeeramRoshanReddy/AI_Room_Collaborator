import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaGraduationCap } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUserContext } from '../../context/UserContext';
import { supabase } from '../../utils/supabaseClient';

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

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #4285f4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Construct API_BASE URL properly
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isProcessingCallback, setIsProcessingCallback] = React.useState(false);
  
  // Use UserContext
  const { user, loading, isAuthenticated, refreshUser, handleOAuthCallback } = useUserContext();
  
  // Show error if redirected back with error param
  const params = new URLSearchParams(location.search);
  const error = params.get('error');
  const success = params.get('success');
  const token = params.get('token');
  const code = params.get('code');

  useEffect(() => {
    // Handle OAuth callback with token
    if (token) {
      setIsProcessingCallback(true);
      console.log('Token found in URL, processing OAuth callback...');
      
      const callbackHandled = handleOAuthCallback();
      if (callbackHandled) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error('Failed to process login callback');
      }
      setIsProcessingCallback(false);
      return;
    }

    // Handle OAuth callback with authorization code
    if (code) {
      setIsProcessingCallback(true);
      console.log('Authorization code found, exchanging for token...');
      exchangeCodeForToken(code);
      return;
    }

    // If user is already authenticated (from context), redirect to dashboard
    if (!loading && isAuthenticated) {
      console.log('User already authenticated from context:', user);
      navigate('/dashboard');
      return;
    }

    // Check for successful login callback (legacy)
    if (success === 'true') {
      console.log('Login success detected, refreshing user data...');
      refreshUser();
      // Remove success param from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [loading, isAuthenticated, user, navigate, success, refreshUser, token, code, handleOAuthCallback]);

  // Exchange authorization code for token
  const exchangeCodeForToken = async (authCode) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code: authCode }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store token and user data
        localStorage.setItem('authToken', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        toast.success('Login successful!');
        
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Refresh user context and navigate
        refreshUser();
        navigate('/dashboard');
      } else {
        throw new Error(data.error || 'Token exchange failed');
      }
    } catch (err) {
      console.error('Token exchange failed:', err);
      toast.error('Login failed. Please try again.');
      
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } finally {
      setIsProcessingCallback(false);
    }
  };

  // Redirect to dashboard once user data is loaded after successful login
  useEffect(() => {
    if (!loading && isAuthenticated && (success === 'true' || token)) {
      navigate('/dashboard');
    }
  }, [loading, isAuthenticated, navigate, success, token]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = `${API_BASE}/api/auth/google/login`;
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://room-connect-eight.vercel.app/auth/callback'
      }
    });
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

  // Show loading if context is still loading or processing callback
  if (loading || isProcessingCallback) {
    return (
      <LoginContainer>
        <LoginCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <LoadingSpinner />
            <span>{isProcessingCallback ? 'Processing login...' : 'Loading...'}</span>
          </div>
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
          <GoogleButton type="button" onClick={signInWithGoogle}>
            <svg width="20" height="20" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C35.64 2.36 30.13 0 24 0 14.82 0 6.73 5.48 2.69 13.44l7.98 6.2C12.13 13.09 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9.04h12.42c-.54 2.9-2.18 5.36-4.64 7.04l7.18 5.6C43.98 37.36 46.1 31.36 46.1 24.5z"/><path fill="#FBBC05" d="M10.67 28.04c-1.01-2.99-1.01-6.09 0-9.08l-7.98-6.2C.99 16.36 0 20.05 0 24c0 3.95.99 7.64 2.69 11.24l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.13 0 11.64-2.03 15.64-5.52l-7.18-5.6c-2.01 1.35-4.59 2.12-8.46 2.12-6.38 0-11.87-3.59-14.33-8.74l-7.98 6.2C6.73 42.52 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
            Sign in with Google
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