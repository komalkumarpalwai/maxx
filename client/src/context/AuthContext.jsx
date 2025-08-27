import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  // Session timeout: 15 minutes (900000 ms)
  const SESSION_TIMEOUT = 15 * 60 * 1000;
  let timeoutId = null;

  // Reset session timer on user activity
  const resetSessionTimer = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (token) {
      timeoutId = setTimeout(() => {
        logout();
        alert('You have been logged out due to inactivity.');
      }, SESSION_TIMEOUT);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get current user:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  // Setup session timeout listeners
  useEffect(() => {
    if (!token) return;
    resetSessionTimer();
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetSessionTimer));
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(evt => window.removeEventListener(evt, resetSessionTimer));
    };
    // eslint-disable-next-line
  }, [token]);

  const login = async (email, password, isAdmin = false) => {
    try {
      let response;
      // Always use adminLogin route for hardcoded admin email
      if (email === 'komalp@gmail.com') {
        response = await authService.adminLogin(email, password);
      } else if (isAdmin) {
        response = await authService.adminLogin(email, password);
      } else {
        response = await authService.login(email, password);
      }
      const { token: newToken, user: userData } = response;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      const errorData = error.response?.data || {};
      return {
        success: false,
        error: errorData.message || error.message,
        hint: errorData.hint
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { token: newToken, user: newUser } = response;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      // Extract hint and error message from backend response
      const errorData = error.response?.data || {};
      return { 
        success: false, 
        error: errorData.message || error.message,
        hint: errorData.hint,
        errors: errorData.errors
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    if (timeoutId) clearTimeout(timeoutId);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
