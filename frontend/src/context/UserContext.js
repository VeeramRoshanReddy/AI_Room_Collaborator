import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const UserContext = createContext();

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create a single, configured axios instance
// This is crucial for sending HttpOnly cookies with every request
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, 
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // This function is the single source of truth for the user's session.
  // It relies on the browser automatically sending the HttpOnly session cookie.
  const verifyUserSession = useCallback(async () => {
    try {
      console.log('Verifying user session by calling /api/auth/me...');
      const res = await api.get('/api/auth/me');
      
      if (res.data && res.data.user) {
        setUser(res.data.user);
        console.log('User session successfully verified:', res.data.user);
      } else {
        // The API responded, but didn't provide a user
        setUser(null);
      }
    } catch (err) {
      // This will catch 401 Unauthorized errors if the cookie is missing or invalid
      console.log('No active session found or session is expired.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // On initial application load, we check the user's session.
  useEffect(() => {
    verifyUserSession();
  }, [verifyUserSession]);
  
  // The logout function clears the session cookie on the backend
  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setUser(null);
      // Redirect to login page after state is cleared
      window.location.href = '/login';
    }
  };

  const contextValue = {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
    // Provide a way to manually re-check the session if needed, for example after a successful callback.
    refreshUser: verifyUserSession, 
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

// Export the configured axios instance for use throughout the app
export { api };