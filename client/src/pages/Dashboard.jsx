
import React, { useEffect, useState, lazy, Suspense } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, GraduationCap, Building, Calendar } from 'lucide-react';
import Avatar from '../components/Avatar';
import { useNavigate } from 'react-router-dom';
const FeedbackPopup = lazy(() => import('../components/FeedbackPopup'));

const Dashboard = () => {

  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTests, setActiveTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [showProfileBanner, setShowProfileBanner] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);


  useEffect(() => {
    // Redirect admin/superadmin to admin panel
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      navigate('/admin-panel', { replace: true });
      return;
    }
    fetchActiveTests();
    // Profile completeness check
    if (user && (!user.year || !user.branch || !user.college)) {
      setShowProfileBanner(true);
    } else {
      setShowProfileBanner(false);
    }
    // Show feedback popup once per user (per browser)
    if (user && !localStorage.getItem('feedback_shown_' + user._id)) {
      setTimeout(() => setShowFeedback(true), 2000);
    }
  }, [user, navigate]);

  const handleFeedbackClose = () => {
    if (user) localStorage.setItem('feedback_shown_' + user._id, '1');
    setShowFeedback(false);
  };

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

  // Only show non-sensitive info in stats
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
      {/* Feedback Popup */}
      <Suspense fallback={null}>
        {showFeedback && <FeedbackPopup user={user} onClose={handleFeedbackClose} />}
      </Suspense>
      {/* Profile Completeness Banner */}
      {showProfileBanner && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 flex items-center justify-between" role="alert" aria-label="Profile incomplete">
          <div>
            <strong>Complete your profile!</strong> Please update your year, branch, and college for a better experience.
          </div>
          <button className="ml-4 px-3 py-1 bg-yellow-500 text-white rounded" onClick={() => navigate('/profile')} aria-label="Go to profile">Update Now</button>
        </div>
      )}

      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 flex-col sm:flex-row" aria-label="Welcome section">
          <Avatar 
            src={user.profilePic} 
            alt={user.name}
            size="xl"
            fallback={user.name?.charAt(0)}
          />
          <div className="mt-4 sm:mt-0">
            <h1 className="text-3xl font-bold text-secondary-900" aria-label={`Welcome back, ${user.name}`}>Welcome back, {user.name}! 👋</h1>
            <p className="text-secondary-600 mt-2">Here's what's happening with your account today.</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" aria-label="User stats">
        {stats.map((stat, index) => (
          <div key={index} className="card" tabIndex={0} aria-label={stat.label}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color} text-white`} aria-hidden="true">
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
          <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
            <svg className="animate-spin h-8 w-8 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span>Loading tests...</span>
          </div>
        ) : activeTests.length === 0 ? (
          <div className="text-gray-500">No active tests at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Active tests">
            {activeTests.map(test => (
              <div key={test._id} className="card border p-4 flex flex-col justify-between" tabIndex={0} aria-label={test.title}>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{test.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{test.description || 'No description'}</p>
                  <div className="text-xs text-gray-500 mb-2">{test.category}</div>
                </div>
                <a href={`/tests/${test._id}`} className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded text-center" aria-label={`Take test: ${test.title}`}>Take Test</a>
              </div>
            ))}
          </div>
        )}
      </div>

  {/* User's Latest Result Section */}
  {/* Feedback popup and lazy loading for future */}
    </div>
  );
};

export default Dashboard;








