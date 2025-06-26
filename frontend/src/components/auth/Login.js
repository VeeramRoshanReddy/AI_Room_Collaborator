import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaGoogle, FaSpinner, FaEnvelope, FaLock, FaUserPlus, FaKey } from 'react-icons/fa';
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
  transition: all 0.2s ease;
  
  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.25);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
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

const LoadingSpinner = styled(FaSpinner)`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SupabaseForm = styled.form`
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  padding: 12px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme.colors.border};
  font-size: 16px;
  outline: none;
  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const SupabaseButton = styled.button`
  background: ${props => props.theme.colors.primary};
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
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
  transition: background 0.2s;
  &:hover {
    background: ${props => props.theme.colors.secondary};
  }
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ToggleLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
`;
const ToggleLink = styled.button`
  background: none;
  border: none;
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.textLight};
  font-weight: 600;
  cursor: pointer;
  font-size: 15px;
  text-decoration: underline;
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const SuccessMessage = styled.div`
  background: #e6ffed;
  color: #15803d;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  border: 1px solid #bbf7d0;
  font-size: 14px;
`;

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [formType, setFormType] = useState('login'); // 'login' | 'signup' | 'magic'
  const [magicSent, setMagicSent] = useState(false);
  
  const { user, loading, isAuthenticated, refreshUser } = useUserContext();
  
  // Show error if redirected back with error param
  const params = new URLSearchParams(location.search);
  const errorParam = params.get('error');
  const successParam = params.get('success');
  const code = params.get('code');

  useEffect(() => {
    // Handle OAuth callback with authorization code
    if (code) {
      setIsLoading(true);
      console.log('Authorization code found, exchanging for token...');
      exchangeCodeForToken(code);
      return;
    }

    // If user is already authenticated, redirect to dashboard
    if (!loading && isAuthenticated) {
      console.log('User already authenticated:', user);
      navigate('/dashboard');
      return;
    }

    // Check for successful login callback
    if (successParam === 'true') {
      console.log('Login success detected, refreshing user data...');
      refreshUser();
      // Remove success param from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    // Show error if present
    if (errorParam) {
      setError(getErrorMessage(errorParam));
    }
  }, [loading, isAuthenticated, user, navigate, successParam, refreshUser, code, errorParam]);

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

      if (response.ok) {
        toast.success('Login successful!');
        // Refresh user context
        await refreshUser();
        navigate('/dashboard');
      } else {
        throw new Error(data.detail || 'Authentication failed');
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      setError('Failed to complete authentication. Please try again.');
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError(null);
    
    // Get Google OAuth URL from backend
    fetch(`${API_BASE}/api/auth/google/url`)
      .then(response => response.json())
      .then(data => {
        if (data.auth_url) {
          // Redirect to Google OAuth
          window.location.href = data.auth_url;
        } else {
          throw new Error('Failed to get authentication URL');
        }
      })
      .catch(error => {
        console.error('Google login error:', error);
        setError('Failed to start authentication. Please try again.');
        setIsLoading(false);
      });
  };

  // Supabase Auth (email/password) login
  const handleSupabaseLogin = async (e) => {
    e.preventDefault();
    setSupabaseLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (supabaseError) {
        setError(supabaseError.message);
        setSupabaseLoading(false);
        return;
      }
      if (data.session && data.session.access_token) {
        localStorage.setItem('airoom_supabase_token', data.session.access_token);
        localStorage.setItem('airoom_user_data', JSON.stringify(data.session.user));
        toast.success('Login successful!');
        await refreshUser();
        navigate('/dashboard');
      } else {
        setError('Login failed. No session returned.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setSupabaseLoading(false);
    }
  };

  // Supabase Auth (email/password) sign-up
  const handleSupabaseSignup = async (e) => {
    e.preventDefault();
    setSupabaseLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (supabaseError) {
        setError(supabaseError.message);
        setSupabaseLoading(false);
        return;
      }
      if (data.user) {
        setSuccess('Sign-up successful! Please check your email to confirm your account.');
        setFormType('login');
        setEmail('');
        setPassword('');
      } else {
        setError('Sign-up failed.');
      }
    } catch (err) {
      setError('Sign-up failed. Please try again.');
    } finally {
      setSupabaseLoading(false);
    }
  };

  // Supabase Magic Link login
  const handleSupabaseMagicLink = async (e) => {
    e.preventDefault();
    setSupabaseLoading(true);
    setError(null);
    setSuccess(null);
    setMagicSent(false);
    try {
      const { error: supabaseError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (supabaseError) {
        setError(supabaseError.message);
        setSupabaseLoading(false);
        return;
      }
      setMagicSent(true);
      setSuccess('Magic link sent! Please check your email.');
    } catch (err) {
      setError('Failed to send magic link. Please try again.');
    } finally {
      setSupabaseLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'access_denied': 'Access was denied. Please try again.',
      'invalid_request': 'Invalid request. Please try again.',
      'server_error': 'Server error. Please try again later.',
      'temporarily_unavailable': 'Service temporarily unavailable. Please try again later.',
      'default': 'An error occurred during authentication. Please try again.'
    };
    return errorMessages[errorCode] || errorMessages.default;
  };

  if (loading || isLoading) {
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
          <Title>AI Room Collaborator</Title>
          <Subtitle>Loading...</Subtitle>
          <LoadingSpinner size={24} />
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
        
        <Title>AI Room Collaborator</Title>
        <Subtitle>
          Join the future of collaborative learning with AI-powered rooms, 
          real-time chat, and intelligent study tools.
        </Subtitle>

        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}
        {success && (
          <SuccessMessage>
            {success}
          </SuccessMessage>
        )}

        <GoogleButtonContainer>
          <GoogleButton 
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size={16} />
            ) : (
              <FaGoogle size={16} />
            )}
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </GoogleButton>
        </GoogleButtonContainer>

        <ToggleLinks>
          <ToggleLink active={formType === 'login'} onClick={() => { setFormType('login'); setError(null); setSuccess(null); }}>Login</ToggleLink>
          <ToggleLink active={formType === 'signup'} onClick={() => { setFormType('signup'); setError(null); setSuccess(null); }}>Sign Up</ToggleLink>
          <ToggleLink active={formType === 'magic'} onClick={() => { setFormType('magic'); setError(null); setSuccess(null); }}>Magic Link</ToggleLink>
        </ToggleLinks>

        {formType === 'login' && (
          <SupabaseForm onSubmit={handleSupabaseLogin}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <SupabaseButton type="submit" disabled={supabaseLoading}>
              {supabaseLoading ? <LoadingSpinner size={16} /> : <FaEnvelope size={16} />}
              {supabaseLoading ? 'Signing in...' : 'Sign in with Email'}
            </SupabaseButton>
          </SupabaseForm>
        )}

        {formType === 'signup' && (
          <SupabaseForm onSubmit={handleSupabaseSignup}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
            <Input
              type="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <SupabaseButton type="submit" disabled={supabaseLoading}>
              {supabaseLoading ? <LoadingSpinner size={16} /> : <FaUserPlus size={16} />}
              {supabaseLoading ? 'Signing up...' : 'Sign Up'}
            </SupabaseButton>
          </SupabaseForm>
        )}

        {formType === 'magic' && (
          <SupabaseForm onSubmit={handleSupabaseMagicLink}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
            <SupabaseButton type="submit" disabled={supabaseLoading || magicSent}>
              {supabaseLoading ? <LoadingSpinner size={16} /> : <FaKey size={16} />}
              {supabaseLoading ? 'Sending...' : (magicSent ? 'Magic Link Sent' : 'Send Magic Link')}
            </SupabaseButton>
          </SupabaseForm>
        )}

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
            <span>Secure End-to-End Chat</span>
          </FeatureItem>
          <FeatureItem>
            <FaGraduationCap />
            <span>Document Analysis</span>
          </FeatureItem>
          <FeatureItem>
            <FaGraduationCap />
            <span>Quiz Generation</span>
          </FeatureItem>
          <FeatureItem>
            <FaGraduationCap />
            <span>Audio Overviews</span>
          </FeatureItem>
        </FeaturesList>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;