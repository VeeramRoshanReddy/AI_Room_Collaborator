import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context/UserContext';
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaRocket } from 'react-icons/fa';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { API_BASE } from '../../utils/api';

const Page = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Hero = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 64px;
  color: white;

  @media (max-width: 900px) {
    display: none;
  }
`;

const HeroTitle = styled.h1`
  font-size: 2.75rem;
  font-weight: 800;
  line-height: 1.15;
  margin-bottom: 16px;
`;

const HeroText = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
  max-width: 420px;
`;

const FeatureList = styled.ul`
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  list-style: none;
  padding: 0;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
`;

const FormPanel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #f8fafc;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow: 0 25px 50px rgba(15, 23, 42, 0.15);
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  color: #2563eb;
  font-weight: 800;
  font-size: 1.25rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: #64748b;
  margin-bottom: 24px;
  font-size: 0.95rem;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 12px;
`;

const Tab = styled.button`
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  background: ${(p) => (p.$active ? 'white' : 'transparent')};
  color: ${(p) => (p.$active ? '#2563eb' : '#64748b')};
  box-shadow: ${(p) => (p.$active ? '0 2px 8px rgba(37,99,235,0.12)' : 'none')};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputWrap = styled.div`
  position: relative;
`;

const Icon = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 40px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  background: #f8fafc;
  &:focus {
    outline: none;
    border-color: #2563eb;
    background: white;
  }
`;

const Toggle = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  color: #94a3b8;
  cursor: pointer;
`;

const Submit = styled.button`
  margin-top: 8px;
  padding: 13px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorBox = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.9rem;
`;

const Login = () => {
  const navigate = useNavigate();
  const { handleLogin, handleSignup } = useUserContext();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    // Render's free tier spins the backend down when idle. Ping it as soon as
    // the login page loads so the cold start happens while the user is still
    // typing their credentials, instead of only starting once they submit.
    const healthUrl = `${API_BASE.replace(/\/api\/v1\/?$/, '')}/health`;
    fetch(healthUrl).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(timer);
  }, [loading]);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Name is required');
        if (password.length < 8) throw new Error('Password must be at least 8 characters');
        await handleSignup(name.trim(), email, password);
        toast.success('Account created successfully!');
      } else {
        await handleLogin(email, password);
        toast.success('Welcome back!');
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Something went wrong';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Hero>
        <HeroTitle>StudyBuddy</HeroTitle>
        <HeroText>
          Study together in real time. Share rooms, discuss topics, upload notes, and get AI-powered help — all in one place.
        </HeroText>
        <FeatureList>
          <FeatureItem>🔐 Secure authentication & encrypted chat</FeatureItem>
          <FeatureItem>🏠 Collaborative rooms with 8-digit IDs</FeatureItem>
          <FeatureItem>📝 Personal notes with document AI analysis</FeatureItem>
          <FeatureItem>🤖 @chatbot integration in group discussions</FeatureItem>
        </FeatureList>
      </Hero>

      <FormPanel>
        <Card>
          <Brand>
            <FaRocket /> StudyBuddy
          </Brand>
          <Title>{mode === 'login' ? 'Sign in' : 'Create account'}</Title>
          <Subtitle>
            {mode === 'login'
              ? 'Enter your credentials to access your workspace'
              : 'Join thousands of learners collaborating with AI'}
          </Subtitle>

          <Tabs>
            <Tab type="button" $active={mode === 'login'} onClick={() => setMode('login')}>
              Login
            </Tab>
            <Tab type="button" $active={mode === 'signup'} onClick={() => setMode('signup')}>
              Sign Up
            </Tab>
          </Tabs>

          {error && <ErrorBox>{error}</ErrorBox>}

          <Form onSubmit={onSubmit}>
            {mode === 'signup' && (
              <InputWrap>
                <Icon><FaUser /></Icon>
                <Input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </InputWrap>
            )}
            <InputWrap>
              <Icon><FaEnvelope /></Icon>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </InputWrap>
            <InputWrap>
              <Icon><FaLock /></Icon>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <Toggle type="button" onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </Toggle>
            </InputWrap>
            <Submit type="submit" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Submit>
            {slow && (
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
                Our free-tier server is waking up after being idle — this can take up to a minute.
              </p>
            )}
          </Form>
        </Card>
      </FormPanel>
    </Page>
  );
};

export default Login;
