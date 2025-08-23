import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const AdminAnalytics = () => {
  const [testStats, setTestStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Example: fetch all test results
      const res = await api.get('/tests/results/all');
      const results = res.data.results || [];
      // Aggregate stats by test
      const stats = {};
      results.forEach(r => {
        const t = r.test?.title || 'Unknown';
        if (!stats[t]) stats[t] = { attempts: 0, passes: 0, fails: 0 };
        stats[t].attempts++;
        if (r.passed) stats[t].passes++;
        else stats[t].fails++;
      });
      setTestStats(Object.entries(stats).map(([title, s]) => ({ title, ...s })));
    } catch {
      setTestStats([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;

  if (!testStats.length) return <div className="p-8 text-center">No analytics data available.</div>;

  // Bar chart data
  const barData = {
    labels: testStats.map(s => s.title),
    datasets: [
      {
        label: 'Attempts',
        data: testStats.map(s => s.attempts),
        backgroundColor: 'rgba(59,130,246,0.7)',
      },
      {
        label: 'Passes',
        data: testStats.map(s => s.passes),
        backgroundColor: 'rgba(34,197,94,0.7)',
      },
      {
        label: 'Fails',
        data: testStats.map(s => s.fails),
        backgroundColor: 'rgba(239,68,68,0.7)',
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Admin Analytics</h2>
      <div className="mb-8 bg-white rounded shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Test Participation & Pass Rates</h3>
        <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
      </div>
      {/* Pie chart for pass/fail ratio of all tests */}
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Overall Pass/Fail Ratio</h3>
        <Pie data={{
          labels: ['Passes', 'Fails'],
          datasets: [{
            data: [testStats.reduce((a, s) => a + s.passes, 0), testStats.reduce((a, s) => a + s.fails, 0)],
            backgroundColor: ['rgba(34,197,94,0.7)', 'rgba(239,68,68,0.7)'],
          }],
        }} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
      </div>
    </div>
  );
};

export default AdminAnalytics;
