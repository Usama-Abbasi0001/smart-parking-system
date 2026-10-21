import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('parkpulse_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('parkpulse_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data.user);
          setToken(storedToken);
        } catch (err) {
          console.error('Session validation failed:', err.message);
          localStorage.removeItem('parkpulse_token');
          localStorage.removeItem('parkpulse_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: userData, token: jwtToken } = res.data.data;

      localStorage.setItem('parkpulse_token', jwtToken);
      localStorage.setItem('parkpulse_user', JSON.stringify(userData));
      setUser(userData);
      setToken(jwtToken);

      toast.success(`Welcome back, ${userData.name}!`);
      return { success: true, user: userData };
    } catch (error) {
      const msg = getErrorMessage(error);
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      const { user: userData, token: jwtToken } = res.data.data;

      localStorage.setItem('parkpulse_token', jwtToken);
      localStorage.setItem('parkpulse_user', JSON.stringify(userData));
      setUser(userData);
      setToken(jwtToken);

      toast.success(`Registration successful! Welcome to ParkPulse.`);
      return { success: true, user: userData };
    } catch (error) {
      const msg = getErrorMessage(error);
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('parkpulse_token');
      localStorage.removeItem('parkpulse_user');
      setUser(null);
      setToken(null);
      toast.success('Signed out successfully.');
    }
  };

  const updateProfile = async (updates) => {
    try {
      const res = await api.patch('/auth/profile', updates);
      const updatedUser = res.data.data.user;
      setUser(updatedUser);
      localStorage.setItem('parkpulse_user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully!');
      return { success: true, user: updatedUser };
    } catch (error) {
      const msg = getErrorMessage(error);
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.patch('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const msg = getErrorMessage(error);
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
