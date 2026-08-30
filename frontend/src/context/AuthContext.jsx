import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoggedInUser();
  }, []);

  const checkLoggedInUser = async () => {
    const token = localStorage.getItem('smart_hr_token');

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data && res.data.user) {
        setUser(res.data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.user) {
        setUser(res.data.user);
        if (res.data.token) {
          localStorage.setItem('smart_hr_token', res.data.token);
        }
      }
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (email, token, newPassword) => {
    const res = await api.post('/auth/reset-password', { email, token, newPassword });
    return res.data;
  };

  const registerOrganization = async (orgData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register-organization', orgData);
      if (res.data && res.data.user) {
        setUser(res.data.user);
        if (res.data.token) {
          localStorage.setItem('smart_hr_token', res.data.token);
        }
      }
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smart_hr_token');
    localStorage.removeItem('smart_hr_mock_user_id');
  };

  const switchRole = async (targetRole) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/switch-role', { targetRole });
      if (res.data && res.data.user) {
        setUser(res.data.user);
        if (res.data.token) {
          localStorage.setItem('smart_hr_token', res.data.token);
        }
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, registerOrganization, forgotPassword, resetPassword, logout, switchRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
