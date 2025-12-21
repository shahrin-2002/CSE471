/**
 * Auth Context - Manages authentication state across the app
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Connect socket when user is authenticated
  useEffect(() => {
    if (token) {
      socketService.connect(token);
      console.log('[Auth] Socket connected for user');
    } else {
      socketService.disconnect();
    }

    return () => {
      // Cleanup on unmount (but don't disconnect on re-renders)
    };
  }, [token]);

  // Login function
// Replace the existing login function with this:
const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });

      // Helpful debug log for developers
      console.log('[Auth] login response', response?.status, response?.data);

      // Normalized handling depending on backend shape
      const data = response?.data || {};

      // If backend asks for OTP
      if (data.requiresOtp) {
        return {
          success: false,
          requiresOtp: true,
          email: data.email,
        };
      }

      // If backend returned token & user (standard login)
      if (data.token) {
        const newToken = data.token;
        const newUser = data.user || {};

        if (newToken) {
          localStorage.setItem('token', newToken);
          localStorage.setItem('user', JSON.stringify(newUser));

          setToken(newToken);
          setUser(newUser);

          return { success: true, user: newUser };
        }
      }

      // Unexpected but non-error response
      return {
        success: false,
        error: data.error || data.message || 'Unexpected response from server',
      };
    } catch (error) {
      console.error('[Auth] login error', error.response?.data || error.message);
      const errMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Login failed';
      return { success: false, error: errMsg };
    }
  };

// Add a new function to the context for verifying OTP
const verifyOtp = async (email, otp) => {
    try {
      const response = await authAPI.verifyOtp({ email, otp });
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Verification failed' 
      };
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      // Don't auto-login - let user go to login page for OTP verification
      return { success: true, message: 'Account created successfully' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Signup failed',
      };
    }
  };

  // Logout function
  const logout = () => {
    socketService.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Get user profile
  const getProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const updatedUser = response.data.user;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch profile',
      };
    }
  };

const value = {
    user,
    setUser,
    token,
    loading,
    login,
    verifyOtp, 
    signup,
    logout,
    getProfile,
    isAuthenticated: !!token,
  // expose setUser for profile updates (already exported above)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
