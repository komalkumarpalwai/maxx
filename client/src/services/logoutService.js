import api from './api';

export const logoutService = {
  async logoutAll() {
    try {
      const response = await api.post('/auth/logout-all');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to logout from all devices');
    }
  }
};
