
import api from './api';

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        const err = new Error(error.response.data.message || 'Login failed');
        err.response = error.response;
        throw err;
      }
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  async adminLogin(email, password) {
    try {
      const response = await api.post('/auth/admin-login', { email, password });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        const err = new Error(error.response.data.message || 'Admin login failed');
        err.response = error.response;
        throw err;
      }
      throw new Error(error.response?.data?.message || 'Admin login failed');
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        const err = new Error(error.response.data.message || 'Registration failed');
        err.response = error.response;
        throw err;
      }
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  async getCurrentUser() {
    // Check if token is for hardcoded admin
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode token payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.userId === 'admin' && payload.role === 'admin') {
          // Return hardcoded admin user
          return {
            id: 'admin',
            name: 'Default Admin',
            email: 'komalp@gmail.com',
            rollNo: 'ADMIN001',
            college: 'Ace Engineering College',
            year: '',
            branch: '',
            profilePic: '/default-avatar.png',
            role: 'admin',
            isActive: true,
            profileUpdateCount: 0,
            passwordHint: 'Contact developer for admin password',
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
      } catch (e) {
        // ignore and fallback to API
      }
    }
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get current user');
    }
  }
};



