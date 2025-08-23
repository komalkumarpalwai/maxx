import api from './api';

export const profileService = {
  async getUserProfile(userId) {
    try {
      const response = await api.get(`/profile/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get user profile');
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  async uploadProfilePicture(file) {
    try {
      const formData = new FormData();
      formData.append('profilePic', file);

      const response = await api.post('/profile/upload-pic', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload profile picture');
    }
  },

  async getAllUsers() {
    try {
      const response = await api.get('/profile/users');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get all users');
    }
  },

  async deleteUser(userId) {
    try {
      const response = await api.delete(`/profile/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  }
};
