import React, { useEffect, useState, useContext } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaGoogle, FaSpinner, FaEnvelope, FaLock, FaUserPlus, FaKey } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UserContext } from '../../context/UserContext';

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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'Login failed');
        setLoading(false);
        return;
      }
      localStorage.setItem('airoom_jwt_token', data.access_token);
      localStorage.setItem('airoom_user', JSON.stringify(data.user));
      setUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password" />
      <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
};

export default Login;