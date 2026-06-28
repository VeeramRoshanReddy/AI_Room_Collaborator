import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export const UserContext = createContext();

const TOKEN_KEY = 'studybuddy_jwt_token';
const USER_KEY = 'studybuddy_user_data';
const API_BASE = process.env.REACT_APP_API_URL || 'https://ai-room-collaborator.onrender.com/api/v1';

const getCachedUser = () => {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(getCachedUser);
  // Only block initial render when we have a token but no cached user to show
  // optimistically — this avoids stalling the whole app (login page included)
  // behind a slow/cold-starting backend on every load.
  const [loading, setLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY) && !getCachedUser());
  const [error, setError] = useState(null);

  const storeAuthData = (token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const removeAuthData = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

  const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const fullUrl = url.startsWith('http')
      ? url
      : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;

    const response = await fetch(fullUrl, { ...options, headers });

    if (response.status === 401) {
      removeAuthData();
      setUser(null);
      setError('Authentication expired. Please login again.');
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
        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage.map((e) => e.msg || JSON.stringify(e)).join(', ');
        }
      } catch {
        // ignore parse errors
      }
      throw new Error(errorMessage);
    }

    return response;
  }, []);

  const handleLogin = useCallback(async (email, password) => {
    setError(null);
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  }, []);

  const handleSignup = useCallback(async (name, email, password) => {
    setError(null);
    if (!name || !email || !password) {
      throw new Error('All fields are required');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  }, []);

  const checkAuthStatus = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await makeAuthenticatedRequest('/auth/me');
      const data = await response.json();
      setUser(data);
      storeAuthData(token, data);
    } catch {
      removeAuthData();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  const handleLogout = useCallback(() => {
    setUser(null);
    removeAuthData();
    setError(null);
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      login: handleLogin,
      signup: handleSignup,
      logout: handleLogout,
      handleLogin,
      handleSignup,
      handleLogout,
      makeAuthenticatedRequest,
      getCurrentUser: checkAuthStatus,
      refreshUser: checkAuthStatus,
    }),
    [user, loading, error, handleLogin, handleSignup, handleLogout, makeAuthenticatedRequest, checkAuthStatus]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
