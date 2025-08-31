import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Users, BarChart3, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import api from '../services/api';

const Tests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attemptedTestIds, setAttemptedTestIds] = useState([]);
  // const { user } = useAuth(); // Not used
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
    fetchAttemptedTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tests');
      if (res.data.success) {
        setTests(res.data.tests);
      } else {
        toast.error('Failed to fetch tests');
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to fetch tests');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all test results for this user to know which tests have been attempted
  const fetchAttemptedTests = async () => {
    try {
      const res = await api.get('/tests/results/student');
      if (res.data.success) {
        const ids = res.data.results.map(r => r.test && (r.test._id || r.test));
        setAttemptedTestIds(ids);
      }
    } catch (error) {
      // ignore
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active Now';
      case 'upcoming':
        return 'Coming Soon';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartTest = (testId) => {
    navigate(`/starttest/${testId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Tests</h1>
        <p className="text-gray-600 mt-2">
          Take tests to improve your skills and track your progress
        </p>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tests available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Check back later for new tests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div key={test._id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {test.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {test.description || 'No description available'}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                  {getStatusText(test.status)}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="w-4 h-4 mr-2" />
                  <span>{test.category}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{test.duration} minutes</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span>{test.totalQuestions} questions</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Passing: {test.passingScore != null && test.passingScore !== '' ? test.passingScore + '%' : 'N/A'}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="text-xs text-gray-500 mb-3">
                  <div>Starts: {formatDate(test.startDate)}</div>
                  <div>Ends: {formatDate(test.endDate)}</div>
                </div>
                
                {test.status === 'active' && !attemptedTestIds.includes(test._id) && (
                  <Button
                    onClick={() => handleStartTest(test._id)}
                    className="w-full"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Test
                  </Button>
                )}
                {test.status === 'active' && attemptedTestIds.includes(test._id) && (
                  <div className="text-center text-green-600 font-semibold py-2">
                    Attempted
                  </div>
                )}
                
                {test.status === 'upcoming' && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    Test will be available soon
                  </div>
                )}
                
                {test.status === 'expired' && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    Test has expired
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tests;








