import React, { createContext, useContext, useState, useEffect } from 'react';

export const UserContext = createContext();

const TOKEN_KEY = 'airoom_jwt_token';
const USER_KEY = 'airoom_user_data';
const API_BASE = process.env.REACT_APP_API_URL || 'https://ai-room-collaborator.onrender.com/api/v1';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Store token and user data in localStorage
  const storeAuthData = (token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  // Clear auth data from localStorage
  const removeAuthData = () => {
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

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!getStoredToken() && !!getStoredUser();
  };

  // Helper function to make authenticated API calls
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = getStoredToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Remove Content-Type for FormData requests
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    // If the url is a relative path, prepend API_BASE
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      // Token expired or invalid
      removeAuthData();
      setUser(null);
      throw new Error('Authentication expired. Please login again.');
    }

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      
      let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (jsonError) {
        console.error('Could not parse error response as JSON:', jsonError);
      }
      
      throw new Error(errorMessage);
    }

    return response;
  };

  // Login function
  const handleLogin = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Login failed. Please check your credentials.');
      }

      const data = await response.json();
      storeAuthData(data.access_token, data.user);
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Signup function
  const handleSignup = async (name, email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Signup failed');
      }

      const data = await response.json();
      storeAuthData(data.access_token, data.user);
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Check authentication status with backend
  const checkAuthStatus = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await makeAuthenticatedRequest('/auth/me');
      const data = await response.json();

      if (data) {
        setUser(data);
        storeAuthData(token, data);
      } else {
        // Token is invalid
        removeAuthData();
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      removeAuthData();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Get current user info
  const getCurrentUser = async () => {
    try {
      const response = await makeAuthenticatedRequest('/auth/me');
      const data = await response.json();
      
      if (data) {
        setUser(data);
        storeAuthData(getStoredToken(), data);
        return data;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      setLoading(true);
      await getCurrentUser();
    } catch (error) {
      console.error('Error refreshing user:', error);
      // Don't clear auth data on refresh error, just log it
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    setUser(null);
    removeAuthData();
    window.location.href = '/login';
  };

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have stored auth data
        const storedToken = getStoredToken();
        const storedUser = getStoredUser();
        
        if (storedToken && storedUser) {
          // Verify with backend
          await checkAuthStatus();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError('Failed to initialize authentication');
        removeAuthData();
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: isAuthenticated(),
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    refreshUser,
    makeAuthenticatedRequest,
    getCurrentUser
  };

  return (
    <UserContext.Provider value={value}>
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