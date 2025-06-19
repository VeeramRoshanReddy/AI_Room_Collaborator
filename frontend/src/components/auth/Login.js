import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaGraduationCap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
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

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google/login';
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
        <GoogleButtonContainer>
          <GoogleButton onClick={handleGoogleLogin}>
            <img src="/google_g_logo.png" alt="Google Logo" style={{ width: 24, height: 24 }} />
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