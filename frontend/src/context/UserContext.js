import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const UserContext = createContext();

// Create axios instance with interceptors
const api = axios.create();

// Request interceptor to add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Check for token in localStorage on initial load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setLoading(false);
        // Verify token is still valid
        fetchUser();
      } catch (err) {
        console.error('Error parsing saved user data:', err);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user info from backend
  const fetchUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(`${API_BASE}/api/auth/me`, { 
        withCredentials: true 
      });
      
      if (res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      // Clear invalid token and user data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function (can be called after successful login)
  const login = (userData, token) => {
    if (token) {
      localStorage.setItem('authToken', token);
    }
    if (userData) {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post(`${API_BASE}/api/auth/logout`, {}, { 
        withCredentials: true 
      });
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      // Clear all auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  // Refresh user data
  const refreshUser = () => {
    fetchUser();
  };

  // Check for token in URL (after OAuth callback)
  const handleOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    
    if (token) {
      localStorage.setItem('authToken', token);
      
      if (userParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam));
          login(userData, token);
        } catch (err) {
          console.error('Error parsing user data from URL:', err);
          // Fetch user data with the token
          fetchUser();
        }
      } else {
        // Fetch user data with the token
        fetchUser();
      }
      
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      return true;
    }
    return false;
  };

  const contextValue = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    handleOAuthCallback,
    isAuthenticated: !!user && !!localStorage.getItem('authToken')
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

// Export the configured axios instance for use in other components
export { api };