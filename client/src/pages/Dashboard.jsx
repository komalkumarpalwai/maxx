
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, GraduationCap, Building, Calendar } from 'lucide-react';
import Avatar from '../components/Avatar';
import UserLatestResult from '../components/UserLatestResult';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {

  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTests, setActiveTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);


  useEffect(() => {
    // Redirect admin/superadmin to admin panel
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      navigate('/admin-panel', { replace: true });
      return;
    }
    fetchActiveTests();
  }, [user]);

  const fetchActiveTests = async () => {
    try {
      setLoadingTests(true);
      const res = await api.get('/tests');
      if (res.data.success) {
        setActiveTests(res.data.tests.filter(t => t.status === 'active'));
      } else {
        setActiveTests([]);
      }
    } catch {
      setActiveTests([]);
    } finally {
      setLoadingTests(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Year',
      value: user.year,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      label: 'Branch',
      value: user.branch,
      icon: GraduationCap,
      color: 'bg-green-500',
    },
    {
      label: 'College',
      value: user.college,
      icon: Building,
      color: 'bg-purple-500',
    },
    {
      label: 'Role',
      value: user.role === 'admin' ? 'Administrator' : 'Student',
      icon: User,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Avatar 
            src={user.profilePic} 
            alt={user.name} 
            size="xl"
            fallback={user.name?.charAt(0)}
          />
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-secondary-600 mt-2">
              Here's what's happening with your account today.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">{stat.label}</p>
                <p className="text-lg font-semibold text-secondary-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Tests Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Active Tests</h2>
        {loadingTests ? (
          <div>Loading tests...</div>
        ) : activeTests.length === 0 ? (
          <div className="text-gray-500">No active tests at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTests.map(test => (
              <div key={test._id} className="card border p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{test.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{test.description || 'No description'}</p>
                  <div className="text-xs text-gray-500 mb-2">{test.category}</div>
                </div>
                <a href={`/tests/${test._id}`} className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded text-center">Take Test</a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User's Latest Result Section */}
    </div>
  );
};

export default Dashboard;

