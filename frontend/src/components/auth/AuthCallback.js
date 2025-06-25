import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context/UserContext'; // Assuming this hook exists

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useUserContext();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      // The login function from our context will handle storing the token
      // and fetching the user's data.
      login(token);
      navigate('/dashboard', { replace: true });
    } else {
      // Handle potential errors from the backend
      console.error('Authentication failed:', error);
      navigate('/login', { replace: true, state: { error: 'Authentication Failed' } });
    }
  }, [location, navigate, login]);

  // You can render a loading spinner here
  return <div>Loading...</div>;
};

export default AuthCallback; 