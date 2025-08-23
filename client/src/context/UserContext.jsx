import React, { createContext, useContext, useState } from 'react';
import { profileService } from '../services/profileService';
import { useAuth } from './AuthContext';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await profileService.updateProfile(profileData);
      updateUser(response.user);
      return { 
        success: true, 
        message: response.message,
        remainingUpdates: response.remainingUpdates
      };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePicture = async (file) => {
    setLoading(true);
    try {
      const response = await profileService.uploadProfilePicture(file);
      updateUser(response.user);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getUserProfile = async (userId) => {
    setLoading(true);
    try {
      const response = await profileService.getUserProfile(userId);
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getAllUsers = async () => {
    setLoading(true);
    try {
      const response = await profileService.getAllUsers();
      return { success: true, users: response.users };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    setLoading(true);
    try {
      const response = await profileService.deleteUser(userId);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    updateProfile,
    uploadProfilePicture,
    getUserProfile,
    getAllUsers,
    deleteUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
