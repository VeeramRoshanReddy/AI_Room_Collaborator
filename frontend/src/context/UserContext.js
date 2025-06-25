import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // On mount, check for existing Supabase session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
        setError('Failed to get session');
      } finally {
        setLoading(false);
      }
    };
    getSession();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Add makeAuthenticatedRequest helper
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const baseUrl = process.env.REACT_APP_API_URL || '';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    const opts = {
      ...options,
      credentials: 'include',
    };
    const response = await fetch(fullUrl, opts);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Request failed');
    }
    return response;
  };

  // Logout function for Supabase Auth
  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  // Demo login function (for testing)
  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      setUser(data.user);
      setSession({ user: data.user });
    } catch (err) {
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    user,
    session,
    loading,
    error,
    setUser,
    setSession,
    handleLogout,
    handleLogin,
    makeAuthenticatedRequest,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  return useContext(UserContext);
};