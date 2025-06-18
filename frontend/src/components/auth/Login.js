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
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g><path d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.242 3.648-5.617 3.648-3.383 0-6.148-2.805-6.148-6.273s2.765-6.273 6.148-6.273c1.93 0 3.227.82 3.969 1.523l2.719-2.648c-1.664-1.523-3.805-2.461-6.688-2.461-5.523 0-10 4.477-10 10s4.477 10 10 10c5.773 0 9.594-4.055 9.594-9.773 0-.656-.07-1.148-.164-1.66z" fill="#4285F4"/><path d="M3.153 7.345l3.281 2.406c.898-1.789 2.617-2.93 4.566-2.93 1.105 0 2.148.383 2.953 1.016l2.719-2.648c-1.664-1.523-3.805-2.461-6.688-2.461-3.789 0-7.008 2.461-8.406 5.617z" fill="#34A853"/><path d="M12 22c2.617 0 4.805-.859 6.406-2.344l-2.953-2.422c-.82.547-1.883.867-3.453.867-2.789 0-5.148-1.883-5.992-4.406l-3.281 2.539c1.477 2.953 4.617 5.766 9.273 5.766z" fill="#FBBC05"/><path d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.242 3.648-5.617 3.648-3.383 0-6.148-2.805-6.148-6.273s2.765-6.273 6.148-6.273c1.93 0 3.227.82 3.969 1.523l2.719-2.648c-1.664-1.523-3.805-2.461-6.688-2.461-5.523 0-10 4.477-10 10s4.477 10 10 10c5.773 0 9.594-4.055 9.594-9.773 0-.656-.07-1.148-.164-1.66z" fill="none"/></g></svg>
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