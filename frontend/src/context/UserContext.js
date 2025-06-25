import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// 1. Create a configured axios instance
const api = axios.create({
  baseURL: API_BASE,
});

// 2. Use an interceptor to inject the token into requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  const fetchUser = async () => {
    try {
      console.log("Fetching user with token...");
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
      setToken(data.token);
      console.log("User fetched successfully:", data.user);
    } catch (error) {
      console.error("Failed to fetch user. Token might be invalid.", error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken'); // Clean up invalid token
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (token) => {
    console.log("Storing token and fetching user...");
    localStorage.setItem('authToken', token);
    // After storing the token, fetch the user data
    fetchUser();
  };

  const handleRegister = (token) => {
    // Implementation for registering a new user
  };

  const handleLogout = () => {
    console.log("Logging out.");
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
    window.location.href = '/login'; // Redirect to login
  };

  const contextValue = {
    user,
    token,
    loading,
    error,
    handleLogin,
    handleRegister,
    handleLogout,
    setUser,
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

export { api };