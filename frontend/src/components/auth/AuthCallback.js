import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useUserContext } from '../../context/UserContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useUserContext();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setUser(session.user);
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    });
  }, [navigate, setUser]);

  return <div>Loading...</div>;
};

export default AuthCallback; 