import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_URL;

  // Fetch user info from backend
  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/auth/me`, { 
        withCredentials: true 
      });
      setUser(res.data.user);
    } catch (err) {
      // Only log error if it's not a 401 (unauthorized)
      if (err.response?.status !== 401) {
        console.error('Error fetching user:', err);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function (can be called after successful login)
  const login = (userData) => {
    setUser(userData);
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/api/auth/logout`, {}, { 
        withCredentials: true 
      });
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setUser(null);
    }
  };

  // Refresh user data
  const refreshUser = () => {
    fetchUser();
  };

  useEffect(() => {
    fetchUser();
  }, [API_BASE]);

  const contextValue = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user
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