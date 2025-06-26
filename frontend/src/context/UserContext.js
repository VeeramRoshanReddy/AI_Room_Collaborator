import React, { createContext, useContext, useState, useEffect } from 'react';

export const UserContext = createContext();

const SUPABASE_TOKEN_KEY = 'airoom_supabase_token';
const OAUTH2_TOKEN_KEY = 'airoom_jwt_token';
const USER_KEY = 'airoom_user_data';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Store token and user data in localStorage
  const storeAuthData = (token, userData, type = 'oauth2') => {
    if (token) {
      if (type === 'supabase') {
        localStorage.setItem(SUPABASE_TOKEN_KEY, token);
      } else {
        localStorage.setItem(OAUTH2_TOKEN_KEY, token);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
  };

  // Clear auth data from localStorage
  const clearAuthData = () => {
    localStorage.removeItem(SUPABASE_TOKEN_KEY);
    localStorage.removeItem(OAUTH2_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  // Get stored token (prefer Supabase)
  const getStoredToken = () => {
    return localStorage.getItem(SUPABASE_TOKEN_KEY) || localStorage.getItem(OAUTH2_TOKEN_KEY);
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

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      // Token expired or invalid
      clearAuthData();
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

  // Check authentication status with backend
  const checkAuthStatus = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await makeAuthenticatedRequest('/api/auth/status');
      const data = await response.json();

      if (data.authenticated && data.user) {
        setUser(data.user);
        storeAuthData(token, data.user, token === localStorage.getItem(SUPABASE_TOKEN_KEY) ? 'supabase' : 'oauth2');
      } else {
        // Token is invalid
        clearAuthData();
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      clearAuthData();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Get current user info
  const getCurrentUser = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/auth/me');
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        storeAuthData(getStoredToken(), data.user, getStoredToken() === localStorage.getItem(SUPABASE_TOKEN_KEY) ? 'supabase' : 'oauth2');
        return data.user;
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
  const handleLogout = async () => {
    setLoading(true);
    try {
      // Call logout endpoint
      await makeAuthenticatedRequest('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local data
      setUser(null);
      clearAuthData();
      setLoading(false);
      window.location.href = '/login';
    }
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
        clearAuthData();
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
    refreshUser,
    handleLogout,
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