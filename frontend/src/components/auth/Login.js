import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';
import styled, { keyframes } from 'styled-components';

const blue = '#2563eb';
const lightBlue = '#60a5fa';
const bgBlue = 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageBackground = styled.div`
  min-height: 100vh;
  width: 100vw;
  background: ${bgBlue};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.18);
  padding: 48px 36px 36px 36px;
  min-width: 350px;
  max-width: 400px;
  width: 100%;
  animation: ${fadeIn} 0.7s cubic-bezier(0.4,0,0.2,1);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Header = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  margin-bottom: 32px;
`;

const HeaderTab = styled.button`
  background: none;
  border: none;
  font-size: 2rem;
  font-weight: 700;
  color: ${props => (props.active ? blue : '#b6c2d6')};
  border-bottom: 3px solid ${props => (props.active ? blue : 'transparent')};
  padding: 0 8px 8px 8px;
  cursor: pointer;
  transition: color 0.2s, border-bottom 0.2s;
`;

const Title = styled.h2`
  color: ${blue};
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 16px;
  text-align: center;
`;

const StyledForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin-top: 8px;
`;

const InputGroup = styled.div`
  position: relative;
  width: 100%;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: ${blue};
  font-size: 1.1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 44px 14px 44px;
  border: 1.5px solid ${blue};
  border-radius: 12px;
  font-size: 1.1rem;
  color: ${blue};
  background: #f8fafc;
  font-weight: 500;
  outline: none;
  transition: border 0.2s;
  &:focus {
    border-color: ${lightBlue};
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${blue};
  font-size: 1.1rem;
  cursor: pointer;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px 0;
  background: ${bgBlue};
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.10);
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  &:hover {
    background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%);
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.18);
    transform: translateY(-2px) scale(1.03);
  }
  &:active {
    transform: scale(0.98);
  }
  &:disabled {
    background: #e0e7ef;
    color: #b6c2d6;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const ErrorMsg = styled.div`
  color: #ef4444;
  background: #fee2e2;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 1rem;
  margin-bottom: 8px;
  text-align: center;
`;

const SuccessMsg = styled.div`
  color: #22c55e;
  background: #d1fae5;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 1rem;
  margin-bottom: 8px;
  text-align: center;
`;

const Login = () => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = React.useContext(UserContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'Invalid email or password. Please try again.');
        setLoading(false);
        return;
      }
      localStorage.setItem('airoom_jwt_token', data.access_token);
      localStorage.setItem('airoom_user', JSON.stringify(data.user));
      setUser(data.user);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'Signup failed. Please try again.');
        setLoading(false);
        return;
      }
      setSuccess('Signup successful! You can now log in.');
      setMode('login');
      setName('');
      setPassword('');
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <PageBackground>
      <Card>
        <Header>
          <HeaderTab active={mode === 'login'} onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>Log In</HeaderTab>
          <HeaderTab active={mode === 'signup'} onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}>Sign Up</HeaderTab>
        </Header>
        <Title>{mode === 'login' ? 'Welcome Back!' : 'Create Your Account'}</Title>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        {success && <SuccessMsg>{success}</SuccessMsg>}
        {mode === 'login' ? (
          <StyledForm onSubmit={handleLogin} autoComplete="on">
            <InputGroup>
              <InputIcon><FaEnvelope /></InputIcon>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Email"
                autoComplete="username"
              />
            </InputGroup>
            <InputGroup>
              <InputIcon><FaLock /></InputIcon>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Password"
                autoComplete="current-password"
              />
              <PasswordToggle type="button" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </PasswordToggle>
            </InputGroup>
            <SubmitButton type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log In'}</SubmitButton>
          </StyledForm>
        ) : (
          <StyledForm onSubmit={handleSignup} autoComplete="on">
            <InputGroup>
              <InputIcon><FaUser /></InputIcon>
              <Input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Full Name"
                autoComplete="name"
              />
            </InputGroup>
            <InputGroup>
              <InputIcon><FaEnvelope /></InputIcon>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Email"
                autoComplete="username"
              />
            </InputGroup>
            <InputGroup>
              <InputIcon><FaLock /></InputIcon>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Password"
                autoComplete="new-password"
              />
              <PasswordToggle type="button" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </PasswordToggle>
            </InputGroup>
            <SubmitButton type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</SubmitButton>
          </StyledForm>
        )}
      </Card>
    </PageBackground>
  );
};

export default Login;