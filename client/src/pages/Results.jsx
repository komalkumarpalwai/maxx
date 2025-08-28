
import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, accent = 'blue' }) => (
  <div className={`bg-white rounded-lg shadow-sm border p-4 flex flex-col`}>
    <div className={`text-sm font-medium text-${accent}-600 mb-1`}>{label}</div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
  </div>
);

const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
    <div className="h-32 bg-gray-200 rounded"></div>
  </div>
);

const PAGE_SIZE = 5;

const Results = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [userResult, setUserResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchResults = async () => {
    try {
      console.log('[Results] Fetching results...');
      setError('');
      setLoading(true);
      const res = await api.get('/tests/results/student');
      console.log('[Results] API response:', res);
      if (res.data?.success) {
        const allResults = res.data.results || [];
        // Sort by completedAt desc
        allResults.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        setResults(allResults);
        // Unique tests user has attempted
        const uniqueTests = [];
        const seen = new Set();
        for (const r of allResults) {
          if (r.test && !seen.has(r.test._id)) {
            uniqueTests.push(r.test);
            seen.add(r.test._id);
          }
        }
        setTests(uniqueTests);
      } else {
        console.error('[Results] API returned no success:', res.data);
        setError('Failed to load results');
      }
    } catch (e) {
      console.error('[Results] API error:', e);
      setError('Failed to load results');
    } finally {
      console.log('[Results] Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // Fetch user result for selected test from cached results
  useEffect(() => {
    if (!selectedTest || !user) {
      setUserResult(null);
      return;
    }
    const found = results.find(r => r.test && (r.test._id === selectedTest || r.test === selectedTest));
    setUserResult(found || null);
  }, [selectedTest, user, results]);

  const summary = useMemo(() => {
    if (!results || results.length === 0) return { attempts: 0, avg: 0, best: 0 };
    const attempts = results.length;
    const percentages = results.map(r => r.percentage || 0);
    const avg = Math.round(percentages.reduce((a, b) => a + b, 0) / attempts);
    const best = Math.max(...percentages);
    return { attempts, avg, best };
  }, [results]);

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return results;
    return results.filter(r => (r.test?.title || '').toLowerCase().includes(q));
  }, [results, search]);

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / PAGE_SIZE));
  const currentPageResults = filteredResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const downloadCsv = (rows, filename) => {
    const headers = ['Test Title', 'Category', 'Score', 'Total', 'Percentage', 'Passed', 'Time Taken (min)', 'Completed At'];
    const data = rows.map(r => [
      r.test?.title || '-',
      r.test?.category || '-',
      r.score,
      r.totalScore,
      r.percentage,
      r.passed ? 'Yes' : 'No',
      r.timeTaken,
      new Date(r.completedAt).toLocaleString()
    ]);
    const csv = [headers, ...data].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSelected = () => {
    if (!userResult) return;
    downloadCsv([userResult], 'result.csv');
  };

  const exportAll = () => {
    if (!results || results.length === 0) return;
    downloadCsv(results, 'all_results.csv');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Results</h1>
          <p className="text-gray-600">View your scores and performance across tests.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportAll} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded border">Download All CSV</button>
          <button onClick={fetchResults} className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded">Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Attempts" value={summary.attempts} accent="blue" />
        <StatCard label="Average %" value={`${summary.avg}%`} accent="green" />
        <StatCard label="Best %" value={`${summary.best}%`} accent="purple" />
      </div>

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Skeleton /><Skeleton /><Skeleton /></div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchResults} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: selector + result card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Test Result</h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600" htmlFor="test-select">Select Test</label>
                  <select
                    id="test-select"
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedTest}
                    onChange={e => setSelectedTest(e.target.value)}
                    aria-label="Select a test to view results"
                  >
                    <option value="">Choose…</option>
                    {tests.map(test => (
                      <option key={test._id} value={test._id}>{test.title}</option>
                    ))}
                  </select>
                  {userResult && (
                    <button onClick={exportSelected} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded border">Download CSV</button>
                  )}
                </div>
              </div>

              {tests.length === 0 && (
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                  You have not attempted any tests yet.
                </div>
              )}

              {selectedTest && userResult && (
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                    <div>
                      <div className="text-sm text-gray-600">Test</div>
                      <div className="text-lg font-semibold text-gray-900">{tests.find(t => t._id === selectedTest)?.title}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs uppercase tracking-wide text-gray-500">Score</div>
                      <div className="text-3xl font-extrabold text-green-700">{userResult.score} / {userResult.totalScore}</div>
                      <div className="text-sm text-gray-600">{userResult.percentage}%</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white rounded border p-3 text-center">
                      <div className="text-xs text-gray-500">Result</div>
                      <div className={`text-sm font-bold ${userResult.passed ? 'text-green-600' : 'text-red-600'}`}>{userResult.passed ? 'Passed' : 'Failed'}</div>
                    </div>
                    <div className="bg-white rounded border p-3 text-center">
                      <div className="text-xs text-gray-500">Time Taken</div>
                      <div className="text-sm font-bold text-gray-900">{userResult.timeTaken} min</div>
                    </div>
                    <div className="bg-white rounded border p-3 text-center">
                      <div className="text-xs text-gray-500">Category</div>
                      <div className="text-sm font-bold text-gray-900">{userResult.test?.category || '-'}</div>
                    </div>
                    <div className="bg-white rounded border p-3 text-center">
                      <div className="text-xs text-gray-500">Completed</div>
                      <div className="text-sm font-bold text-gray-900">{new Date(userResult.completedAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <a
                    href={`/tests/${selectedTest}/attempts`}
                    className="inline-block mt-5 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
                  >
                    View Detailed Attempt
                  </a>
                </div>
              )}

              {selectedTest && !userResult && (
                <div className="p-6 bg-blue-50 border border-blue-200 rounded text-blue-700">
                  No attempt found for the selected test.
                </div>
              )}
            </div>
          </div>

          {/* Right: search + recent attempts */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h3 className="text-md font-semibold text-gray-900">Recent Attempts</h3>
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search test titles"
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Search attempts by test title"
                />
              </div>
              <div className="space-y-3">
                {currentPageResults.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between border rounded px-3 py-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{r.test?.title || 'Test'}</div>
                      <div className="text-xs text-gray-500">{new Date(r.completedAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${r.passed ? 'text-green-600' : 'text-red-600'}`}>{r.percentage}%</div>
                      <div className="text-xs text-gray-500">{r.score}/{r.totalScore}</div>
                    </div>
                  </div>
                ))}
                {filteredResults.length === 0 && (
                  <div className="text-sm text-gray-500">No attempts match the search.</div>
                )}
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <span>Page {page} of {totalPages}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
