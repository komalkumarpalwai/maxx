import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Avatar from '../components/Avatar';

const UserLatestResult = ({ user }) => {
  const [latestResult, setLatestResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.get('/tests/results/student')
      .then(res => {
        const results = res.data.results || [];
        if (results.length > 0) {
          // Sort by completedAt desc, pick latest
          const sorted = results.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
          setLatestResult(sorted[0]);
        } else {
          setLatestResult(null);
        }
      })
      .catch(() => setLatestResult(null))
      .finally(() => setLoading(false));
  }, [user]);

  // Mobile device detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent;
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) return null;

  if (!latestResult) {
    return (
      <div className="mb-8 p-4 bg-gray-50 rounded shadow text-center">
        <span className="text-gray-600">No test results yet. Take a test to see your results here!</span>
      </div>
    );
  }

  return (
    <div className="mb-8 p-6 bg-green-50 rounded shadow flex flex-col md:flex-row items-center md:items-start gap-4">
      <Avatar src={user.profilePic} alt={user.name} size="lg" fallback={user.name?.charAt(0)} />
      <div className="flex-1">
        <div className="text-xl font-bold text-green-800 mb-1">Your Latest Result</div>
        <div className="text-lg font-semibold mb-2 text-gray-900">{latestResult.test?.title || 'Test'}</div>
        <div className="flex flex-wrap gap-4 mb-2">
          <div className="bg-white rounded px-3 py-1 shadow text-green-700 font-semibold text-base">
            Score: <span className="font-bold">{latestResult.score}</span> / {latestResult.totalScore} <span className="text-xs">({latestResult.percentage}%)</span>
          </div>
          <div className="bg-white rounded px-3 py-1 shadow text-blue-700 font-semibold text-base">
            Time Spent: <span className="font-bold">{latestResult.timeTaken}</span> min
          </div>
        </div>
        <div className="text-xs text-gray-500 mb-1">Completed: {new Date(latestResult.completedAt).toLocaleString()}</div>
        {isMobile && (
          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded text-sm">
            <strong>Notice:</strong> For the best experience, please take tests from a desktop or laptop. Mobile devices are not supported for test-taking.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserLatestResult;
