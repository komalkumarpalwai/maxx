import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, FileText, BarChart3, Settings, GraduationCap, Info } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  // Calculate remaining profile updates
  const remainingUpdates = user ? 2 - (user.profileUpdateCount || 0) : 2;

  const menuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/',
      description: 'Overview and statistics'
    },
    {
      label: 'Profile',
      icon: User,
      path: '/profile',
      description: 'Manage your profile'
    },
    {
      label: 'Tests',
      icon: FileText,
      path: '/tests',
      description: 'Available tests'
    },
    {
      label: 'Results',
      icon: BarChart3,
      path: '/results',
      description: 'Your test results'
    },
    {
      label: 'Academic',
      icon: GraduationCap,
      path: '/academic',
      description: 'Academic information'
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      description: 'Application settings'
    },
    // Admin analytics link (only for admin)
    ...(user && user.role === 'admin' ? [{
      label: 'Admin Analytics',
      icon: BarChart3,
      path: '/admin/analytics',
      description: 'Test analytics and charts'
    }] : [])
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar w-64">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Max Solutions</h2>
            <p className="text-sm text-gray-500">Engineering Excellence</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <div key={item.label}>
              <button
                onClick={() => navigate(item.path)}
                className={`nav-link w-full ${
                  isActive(item.path) ? 'nav-link-active' : 'nav-link-inactive'
                }`}
              >
                <item.icon 
                  className={`w-5 h-5 ${
                    isActive(item.path) ? 'text-blue-600' : 'text-gray-500'
                  }`} 
                />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs ${
                    isActive(item.path) ? 'text-blue-500' : 'text-gray-400'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </button>
              
              {/* Profile Update Limit Indicator */}
              {item.label === 'Profile' && remainingUpdates < 2 && (
                <div className="ml-12 mb-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Info className="w-3 h-3 text-blue-600" />
                    <span className="text-xs text-blue-700">
                      {remainingUpdates} update{remainingUpdates !== 1 ? 's' : ''} remaining
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
