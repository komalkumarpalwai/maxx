import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Button from '../components/Button';

const TestAnalytics = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) fetchAnalytics(selectedExam);
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await api.get('/tests?all=1');
      if (res.data.success) setExams(res.data.tests);
    } catch {}
  };

  const fetchAnalytics = async (examId) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/tests/${examId}/analytics`);
      if (res.data.success) setAnalytics(res.data.analytics);
      else setError(res.data.message || 'No analytics');
    } catch (e) {
      setError('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const res = await api.get('/tests/results/all');
      if (!res.data.success) return;
      const results = res.data.results.filter(r => r.test && (r.test._id === selectedExam || r.test === selectedExam));
      if (!results.length) return alert('No results to export');
      const headers = ['Name', 'Roll No', 'Score', 'Total Score', 'Percentage', 'Result'];
      const rows = results.map(r => [
        r.studentName || r.student?.name || '',
        r.studentRollNo || r.student?.rollNo || '',
        r.score,
        r.totalScore,
        r.percentage,
        r.passed ? 'Pass' : 'Fail'
      ]);
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test_results.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export CSV');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Test Analytics</h1>
      <div className="mb-4 p-2 bg-yellow-50 border border-yellow-400 text-yellow-800 rounded text-sm">
        <b>Note:</b> Please use the <b>Reload</b> button below to refresh this page. Do <b>not</b> use your browser or device reload button, or you may lose your session or data.
      </div>
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <button onClick={() => window.location.reload()} className="px-3 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded">Reload</button>
        <select
          className="border rounded px-3 py-2"
          value={selectedExam}
          onChange={e => setSelectedExam(e.target.value)}
        >
          <option value="">Select Exam</option>
          {exams.map(exam => (
            <option key={exam._id} value={exam._id}>
              {exam.title} ({exam.category})
            </option>
          ))}
        </select>
        <Button onClick={handleDownloadCSV} disabled={!selectedExam}>
          Download Results (CSV)
        </Button>
      </div>
      {loading ? <p>Loading...</p> : error ? <p className="text-red-600">{error}</p> : analytics && (
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{analytics.testTitle}</h2>
          <ul className="space-y-2">
            <li>Total Attempts: <b>{analytics.totalAttempts}</b></li>
            <li>Average Score: <b>{analytics.averageScore}</b></li>
            <li>Average Percentage: <b>{analytics.averagePercentage}%</b></li>
            <li>Highest Score: <b>{analytics.highestScore}</b></li>
            <li>Lowest Score: <b>{analytics.lowestScore}</b></li>
            <li>Pass Rate: <b>{analytics.passRate}%</b></li>
            <li>Fail Rate: <b>{analytics.failRate}%</b></li>
            <li>Passed: <b>{analytics.passed}</b></li>
            <li>Failed: <b>{analytics.failed}</b></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default TestAnalytics;
