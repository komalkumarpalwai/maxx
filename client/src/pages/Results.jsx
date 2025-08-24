
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Results = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [userResult, setUserResult] = useState(null);

  useEffect(() => {
    // Only show tests the user has attempted
    api.get('/tests/results/student').then(res => {
      if (res.data.success) {
        // Map to unique tests
        const uniqueTests = [];
        const seen = new Set();
        for (const r of res.data.results) {
          if (r.test && !seen.has(r.test._id)) {
            uniqueTests.push(r.test);
            seen.add(r.test._id);
          }
        }
        setTests(uniqueTests);
      }
    });
  }, []);

  // Remove leaderboard fetching

  // Fetch user's own result for the selected test
  useEffect(() => {
    if (!selectedTest || !user) {
      setUserResult(null);
      return;
    }
    api.get('/tests/results/student').then(res => {
      if (res.data.success) {
        const found = res.data.results.find(r => r.test && (r.test._id === selectedTest || r.test === selectedTest));
        setUserResult(found || null);
      }
    });
  }, [selectedTest, user]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded shadow p-6 mt-8">
        <h2 className="text-xl font-bold mb-4">Your Test Results</h2>
        <div className="mb-6">
          <label className="mr-2 font-medium">Test:</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedTest}
            onChange={e => setSelectedTest(e.target.value)}
          >
            <option value="">Select a Test</option>
            {tests.map(test => (
              <option key={test._id} value={test._id}>{test.title}</option>
            ))}
          </select>
        </div>
        {selectedTest && userResult ? (
          <div className="p-6 bg-green-50 border border-green-200 rounded text-center">
            <div className="text-lg font-semibold text-green-700 mb-2">Result for: {tests.find(t => t._id === selectedTest)?.title}</div>
            <div className="text-gray-900 text-2xl font-bold mb-2">{userResult.score} / {userResult.totalScore}</div>
            <div className="text-gray-700 mb-1">Percentage: <span className="font-bold">{userResult.percentage}%</span></div>
            <div className="text-gray-700 mb-1">Time Taken: {userResult.timeTaken} min</div>
            <div className="text-gray-500 text-xs">Completed: {new Date(userResult.completedAt).toLocaleString()}</div>
            <a
              href={`/tests/${selectedTest}/attempts`}
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
            >
              View Detailed Attempt
            </a>
          </div>
        ) : selectedTest && !userResult ? (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded text-center text-yellow-700">
            You have not attempted this test yet.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Results;
