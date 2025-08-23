import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, X, User, Mail, GraduationCap, Building, Hash, AlertTriangle, Info } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';
import { logoutService } from '../services/logoutService';

const Profile = () => {
  const { user, updateProfile, uploadProfilePicture, loading } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogoutAll = async () => {
    try {
      await logoutService.logoutAll();
      logout(); // Clear local session
      toast.success('Logged out from all devices!');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Failed to logout from all devices');
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showUpdateLimitPopup, setShowUpdateLimitPopup] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    year: user?.year || '',
    branch: user?.branch || '',
    college: user?.college || ''
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [profilePicTimestamp, setProfilePicTimestamp] = useState(Date.now());

  // Calculate remaining updates
  const remainingUpdates = 2 - (user?.profileUpdateCount || 0);
  const canUpdate = remainingUpdates > 0;

  const yearOptions = [
    { value: '1st Year', label: '1st Year' },
    { value: '2nd Year', label: '2nd Year' },
    { value: '3rd Year', label: '3rd Year' },
    { value: '4th Year', label: '4th Year' }
  ];

  const branchOptions = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Electrical', label: 'Electrical' },
    { value: 'Mechanical', label: 'Mechanical' },
    { value: 'Civil', label: 'Civil' },
    { value: 'Electronics', label: 'Electronics' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.year) {
      newErrors.year = 'Year is required';
    }

    if (!formData.branch) {
      newErrors.branch = 'Branch is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const result = await updateProfile(formData);
      
      if (result.success) {
        toast.success(result.message || 'Profile updated successfully!');
        if (result.remainingUpdates !== undefined) {
          toast.success(`You have ${result.remainingUpdates} profile update${result.remainingUpdates !== 1 ? 's' : ''} remaining.`);
        }
        setIsEditing(false);
      } else {
        if (result.error === 'UPDATE_LIMIT_REACHED') {
          toast.error('Profile update limit reached! You can only update your profile 2 times.');
          setShowUpdateLimitPopup(true);
        } else {
          toast.error(result.error || 'Failed to update profile');
        }
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadProfilePicture(file);
      if (result.success) {
        toast.success(result.message || 'Profile picture uploaded successfully!');
        setProfilePicTimestamp(Date.now()); // Update timestamp to force image refresh
      } else {
        toast.error(result.error || 'Failed to upload profile picture');
      }
    } catch (error) {
      toast.error('An error occurred while uploading profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = () => {
    setFormData({
      name: user?.name || '',
      year: user?.year || '',
      branch: user?.branch || '',
      college: user?.college || ''
    });
    setErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Profile</h1>
        <p className="text-secondary-600 mt-2">Manage your personal information and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture Section */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <div className="relative inline-block">
              <Avatar 
                src={user.profilePic ? `${user.profilePic.startsWith('http') ? user.profilePic : 'http://localhost:5001' + user.profilePic}?t=${profilePicTimestamp}` : ''} 
                alt={user.name} 
                size="2xl"
                fallback={user.name?.charAt(0)}
                className="mb-4"
              />
              
              {/* Upload Button */}
              <label className="absolute bottom-2 right-2 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors duration-200">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {uploading && (
              <div className="text-sm text-secondary-500">
                Uploading...
              </div>
            )}

            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              {user.name}
            </h3>
            <p className="text-secondary-600 text-sm mb-4">
              {user.role === 'admin' ? 'Administrator' : 'Student'}
            </p>

            <div className="space-y-2 text-sm text-secondary-600">
              <div className="flex items-center justify-center space-x-2">
                <Hash className="w-4 h-4" />
                <span>{user.rollNo}</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="lg:col-span-2">
          {/* Profile Update Limit Indicator */}
          <div className="card mb-4 bg-blue-50 border-blue-200">
            <div className="flex items-center space-x-3">
              <Info className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Profile Update Limit
                </h3>
                <p className="text-sm text-blue-700">
                  {canUpdate 
                    ? `You have ${remainingUpdates} profile update${remainingUpdates !== 1 ? 's' : ''} remaining.`
                    : 'You have reached your profile update limit (2 updates maximum).'
                  }
                </p>
                {remainingUpdates === 1 && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    ⚠️ Last update remaining! Choose carefully.
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[1, 2].map((update) => (
                    <div
                      key={update}
                      className={`w-3 h-3 rounded-full ${
                        update <= (2 - remainingUpdates) 
                          ? 'bg-blue-600' 
                          : 'bg-blue-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-blue-600 font-medium">
                  {remainingUpdates}/2
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <Button onClick={handleLogoutAll} variant="danger" className="ml-auto mb-2">
                Logout from all devices
              </Button>
              <h2 className="text-xl font-semibold text-secondary-900">
                Personal Information
              </h2>
              
              {!isEditing ? (
                <Button 
                  onClick={handleEdit} 
                  variant="outline"
                  disabled={!canUpdate}
                  title={!canUpdate ? 'Profile update limit reached (2 updates maximum)' : 'Edit your profile'}
                >
                  {canUpdate ? 'Edit Profile' : 'Update Limit Reached'}
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSubmit} 
                    loading={loading}
                    disabled={loading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={handleCancel} variant="secondary">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="Enter your full name"
                  />

                  <Input
                    label="College"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    placeholder="Enter college name"
                  />

                  <Select
                    label="Year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    error={errors.year}
                    options={yearOptions}
                  />

                  <Select
                    label="Branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    error={errors.branch}
                    options={branchOptions}
                  />
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-secondary-500">Full Name</label>
                  <p className="text-secondary-900">{user.name}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-secondary-500">College</label>
                  <p className="text-secondary-900">{user.college}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-secondary-500">Year</label>
                  <p className="text-secondary-900">{user.year}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-secondary-500">Branch</label>
                  <p className="text-secondary-900">{user.branch}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-secondary-500">Roll Number</label>
                  <p className="text-secondary-900">{user.rollNo}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-secondary-500">Email</label>
                  <p className="text-secondary-900">{user.email}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-secondary-500">Role</label>
                  <p className="text-secondary-900 capitalize">{user.role}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-secondary-500">Member Since</label>
                  <p className="text-secondary-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Limit Popup */}
      {showUpdateLimitPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Update Limit Reached
                </h3>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              You have reached your profile update limit of 2 times. This limit is set to maintain data integrity and prevent frequent changes to student records.
            </p>
            
            <div className="flex justify-end">
              <Button 
                onClick={() => setShowUpdateLimitPopup(false)}
                variant="outline"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
