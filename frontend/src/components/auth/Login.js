import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';
import styled from 'styled-components';

const blue = '#2563eb';
const lightBlue = '#60a5fa';

// Light, minimal background
const MinimalBackground = styled.div`
  min-height: 100vh;
  width: 100vw;
  background: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 8px 32px 0 rgba(37,99,235,0.10), 0 1.5px 6px 0 rgba(96,165,250,0.08);
  padding: 44px 38px 32px 38px;
  min-width: 350px;
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Inter', 'Montserrat', 'Poppins', sans-serif;
`;

const Illustration = styled.div`
  width: 110px;
  height: 110px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h2`
  color: ${blue};
  font-size: 1.45rem;
  font-weight: 800;
  margin-bottom: 24px;
  text-align: center;
  letter-spacing: 0.5px;
`;

const TabRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
`;
const Tab = styled.button`
  background: none;
  border: none;
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => (props.active ? blue : '#b6c2d6')};
  border-bottom: 2.5px solid ${props => (props.active ? blue : 'transparent')};
  padding: 0 8px 6px 8px;
  cursor: pointer;
  transition: color 0.18s, border-bottom 0.18s;
  outline: none;
`;

const StyledForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const InputGroup = styled.div`
  position: relative;
  width: 100%;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: ${blue};
  font-size: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 40px 12px 40px;
  border: 1.2px solid #e3e8f0;
  border-radius: 10px;
  font-size: 1rem;
  color: #222;
  background: #f8fafc;
  font-weight: 500;
  outline: none;
  transition: border 0.18s;
  &:focus {
    border-color: ${blue};
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #b6c2d6;
  font-size: 1rem;
  cursor: pointer;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px 0;
  background: ${blue};
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
  transition: background 0.18s, box-shadow 0.18s, transform 0.1s;
  &:hover {
    background: ${lightBlue};
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.13);
    transform: translateY(-1px) scale(1.02);
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
  padding: 8px 12px;
  font-size: 0.98rem;
  margin-bottom: 6px;
  text-align: center;
`;

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // ... your login logic here ...
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // ... your signup logic here ...
    } catch (err) {
      setError('Signup failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <MinimalBackground>
      <Card>
        <Illustration>
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="30" width="80" height="50" rx="12" fill="#e3eefe"/>
            <rect x="22" y="42" width="56" height="8" rx="4" fill="#2563eb"/>
            <rect x="22" y="56" width="36" height="8" rx="4" fill="#60a5fa"/>
            <circle cx="78" cy="60" r="6" fill="#2563eb"/>
            <rect x="35" y="18" width="30" height="8" rx="4" fill="#60a5fa"/>
            <rect x="44" y="10" width="12" height="8" rx="4" fill="#2563eb"/>
          </svg>
        </Illustration>
        <Title>Welcome, please authorize</Title>
        <TabRow>
          <Tab active={mode === 'login'} onClick={() => setMode('login')}>Login</Tab>
          <Tab active={mode === 'signup'} onClick={() => setMode('signup')}>Sign Up</Tab>
        </TabRow>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <StyledForm onSubmit={mode === 'login' ? handleLogin : handleSignup}>
          {mode === 'signup' && (
            <InputGroup>
              <InputIcon><FaUser /></InputIcon>
              <Input
                type="text"
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </InputGroup>
          )}
          <InputGroup>
            <InputIcon><FaEnvelope /></InputIcon>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </InputGroup>
          <InputGroup>
            <InputIcon><FaLock /></InputIcon>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <PasswordToggle type="button" onClick={() => setShowPassword(s => !s)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </PasswordToggle>
          </InputGroup>
          <SubmitButton type="submit" disabled={loading}>
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </SubmitButton>
        </StyledForm>
      </Card>
    </MinimalBackground>
  );
};

export default Login;