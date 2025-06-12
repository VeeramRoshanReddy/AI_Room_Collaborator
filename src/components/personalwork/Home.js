import React from 'react';
import styled from 'styled-components';
import { FaBook, FaUsers, FaRobot } from 'react-icons/fa';

const Background = styled.div`
  min-height: 100%;
  width: 100%;
  background: linear-gradient(135deg, #e0e7ef 0%, #f8fafc 100%), url('https://www.transparenttextures.com/patterns/cubes.png');
  background-blend-mode: lighten;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 48px 0 0 0;
`;

const Welcome = styled.h1`
  font-size: 2.8rem;
  font-weight: 800;
  color: #1d4ed8;
  margin-bottom: 12px;
  font-family: 'Poppins', 'Inter', 'Montserrat', sans-serif;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #2563eb;
  margin-bottom: 36px;
  font-family: 'Poppins', 'Inter', 'Montserrat', sans-serif;
`;

const Features = styled.div`
  display: flex;
  gap: 32px;
  margin-top: 24px;
`;

const FeatureBox = styled.div`
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.10);
  padding: 32px 28px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 8px 32px rgba(37, 99, 235, 0.18);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2.2rem;
  color: #2563eb;
  margin-bottom: 16px;
`;

const FeatureTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
`;

const FeatureDesc = styled.p`
  font-size: 0.98rem;
  color: #64748b;
  text-align: center;
`;

const Home = () => (
  <Background>
    <Welcome>Welcome to AI Learning Platform</Welcome>
    <Subtitle>Empowering collaborative learning with AI-driven tools</Subtitle>
    <Features>
      <FeatureBox>
        <FeatureIcon><FaBook /></FeatureIcon>
        <FeatureTitle>Personal Work</FeatureTitle>
        <FeatureDesc>Upload documents, chat with AI, get summaries, audio overviews, and quizzes.</FeatureDesc>
      </FeatureBox>
      <FeatureBox>
        <FeatureIcon><FaUsers /></FeatureIcon>
        <FeatureTitle>Rooms & Topics</FeatureTitle>
        <FeatureDesc>Join or create rooms, collaborate on topics, and discuss with peers and AI.</FeatureDesc>
      </FeatureBox>
      <FeatureBox>
        <FeatureIcon><FaRobot /></FeatureIcon>
        <FeatureTitle>AI Assistance</FeatureTitle>
        <FeatureDesc>Get instant help, explanations, and quizzes from the AI chatbot anywhere.</FeatureDesc>
      </FeatureBox>
    </Features>
  </Background>
);

export default Home; 