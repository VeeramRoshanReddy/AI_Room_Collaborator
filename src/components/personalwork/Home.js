import React from 'react';
import styled from 'styled-components';
import { FaBook, FaUsers, FaRobot } from 'react-icons/fa';

const HomeWrapper = styled.div`
  height: 100%;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const Welcome = styled.h1`
  font-size: 2.2rem;
  font-weight: 800;
  color: #1d4ed8;
  margin-bottom: 8px;
  font-family: 'Poppins', 'Inter', 'Montserrat', sans-serif;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #2563eb;
  margin-bottom: 18px;
  font-family: 'Poppins', 'Inter', 'Montserrat', sans-serif;
`;

const Features = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 0;
  flex-wrap: wrap;
  justify-content: center;
`;

const FeatureBox = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.10);
  padding: 24px 18px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 8px 32px rgba(37, 99, 235, 0.18);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2rem;
  color: #2563eb;
  margin-bottom: 10px;
`;

const FeatureTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
`;

const FeatureDesc = styled.p`
  font-size: 0.92rem;
  color: #64748b;
  text-align: center;
`;

const Home = () => (
  <HomeWrapper>
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
  </HomeWrapper>
);

export default Home; 