import React, { useEffect } from 'react';
import styled from 'styled-components';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { FaGraduationCap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jwtDecode } from "jwt-decode";

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

const Login = ({ onLogin, setUser }) => {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);

      const userData = {
        name: decoded.name, 
        email: decoded.email, 
        picture: decoded.picture, 
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      onLogin(true);
      
      toast.success('Successfully logged in!');
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    toast.error('Google login failed. Please try again.');
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
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="filled_blue"
            shape="rectangular"
            text="continue_with"
            size="large"
            popup_type="full_screen"
            flow="implicit"
            context="signin"
          />
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