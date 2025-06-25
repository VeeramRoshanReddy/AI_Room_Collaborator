import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export const UserContext = createContext();

const TOKEN_KEY = 'airoom_supabase_token';
const USER_KEY = 'airoom_user_data';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Store token and user data in localStorage
  const storeAuthData = (session, user) => {
    if (session?.access_token) {
      localStorage.setItem(TOKEN_KEY, session.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  };

  // Clear auth data from localStorage
  const clearAuthData = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  // Get stored token
  const getStoredToken = () => {
    return localStorage.getItem(TOKEN_KEY);
  };

  // Get stored user data
  const getStoredUser = () => {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  };

  useEffect(() => {
    // On mount, check for existing Supabase session or stored data
    const initializeAuth = async () => {
      try {
        // First try to get current Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
          // Active Supabase session
          setSession(session);
          setUser(session.user);
          storeAuthData(session, session.user);
        } else {
          // No active session, check localStorage
          const storedToken = getStoredToken();
          const storedUser = getStoredUser();
          
          if (storedToken && storedUser) {
            // We have stored data, create a mock session
            const mockSession = {
              access_token: storedToken,
              user: storedUser
            };
            setSession(mockSession);
            setUser(storedUser);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError('Failed to initialize authentication');
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session) {
        setSession(session);
        setUser(session.user);
        storeAuthData(session, session.user);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        clearAuthData();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
        setUser(session.user);
        storeAuthData(session, session.user);
      }
      
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Helper function to make authenticated API calls
  const makeAuthenticatedRequest = async (url, options = {}) => {
    let token = session?.access_token || getStoredToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const makeRequest = async (authToken) => {
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      };

      return fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    };

    try {
      const response = await makeRequest(token);

      if (response.status === 401) {
        // Token might be expired, try to refresh
        console.log('Token expired, attempting refresh...');
        
        const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
        
        if (error || !refreshedSession) {
          console.error('Token refresh failed:', error);
          // Clear invalid auth data
          clearAuthData();
          setSession(null);
          setUser(null);
          throw new Error('Authentication expired. Please login again.');
        }
        
        // Update session and localStorage
        setSession(refreshedSession);
        setUser(refreshedSession.user);
        storeAuthData(refreshedSession, refreshedSession.user);
        
        // Retry with new token
        const retryResponse = await makeRequest(refreshedSession.access_token);
        
        if (!retryResponse.ok) {
          throw new Error(`Request failed: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        return retryResponse;
      }

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  // Logout function for Supabase Auth
  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      clearAuthData();
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
    isAuthenticated: !!(user && (session?.access_token || getStoredToken())),
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