import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('taskflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('taskflow_access_token');
      if (token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
          localStorage.setItem('taskflow_user', JSON.stringify(userData));
        } catch (err) {
          console.error('Session validation failed:', err);
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username_or_email, password) => {
    const data = await authService.login({ username_or_email, password });
    localStorage.setItem('taskflow_access_token', data.tokens.access);
    localStorage.setItem('taskflow_refresh_token', data.tokens.refresh);
    localStorage.setItem('taskflow_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    localStorage.setItem('taskflow_access_token', data.tokens.access);
    localStorage.setItem('taskflow_refresh_token', data.tokens.refresh);
    localStorage.setItem('taskflow_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const updateProfile = async (profileData) => {
    const updatedUser = await authService.updateProfile(profileData);
    setUser(updatedUser);
    localStorage.setItem('taskflow_user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
