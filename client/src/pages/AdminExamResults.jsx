import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Button from '../components/Button';

const PAGE_SIZE = 15;

const AdminExamResults = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) fetchResults(selectedExam);
  }, [selectedExam]);

  useEffect(() => {
    let data = [...results];
    if (search) {
      data = data.filter(r => {
        const name = r.studentName || r.student?.name || '';
        const roll = r.studentRollNo || r.student?.rollNo || '';
        return (
          name.toLowerCase().includes(search.toLowerCase()) ||
          roll.toLowerCase().includes(search.toLowerCase())
        );
      });
    }
    data.sort((a, b) => {
      const nameA = (a.studentName || a.student?.name || '').toLowerCase();
      const nameB = (b.studentName || b.student?.name || '').toLowerCase();
      if (!nameA || !nameB) return 0;
      return sortAsc
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });
    setFilteredResults(data);
    setPage(1);
  }, [results, search, sortAsc]);

  const fetchExams = async () => {
    try {
      const res = await api.get('/tests?all=1');
      if (res.data.success) {
        // Show all exams that have at least one result (not deleted)
        const allResults = await api.get('/tests/results/all');
        const resultExamIds = new Set((allResults.data.results || []).map(r => r.test?._id || r.test));
        setExams(res.data.tests.filter(t => resultExamIds.has(t._id)));
      }
    } catch {}
  };

  const fetchResults = async (examId) => {
    try {
      const res = await api.get('/tests/results/all');
      if (res.data.success) {
        setResults(res.data.results.filter(r => r.test && (r.test._id === examId || r.test === examId)));
      }
    } catch {}
  };

  const paginated = filteredResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filteredResults.length / PAGE_SIZE);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Result of Exams</h1>
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
        <input
          type="text"
          className="border rounded px-3 py-2"
          placeholder="Search by name or roll no"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={() => setSortAsc(s => !s)}>
          Sort: {sortAsc ? 'A-Z' : 'Z-A'}
        </Button>
      </div>
      {selectedExam && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Roll No</th>
                <th className="px-4 py-2 border">Score</th>
                <th className="px-4 py-2 border">Percentage</th>
                <th className="px-4 py-2 border">Result</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r, idx) => (
                <tr key={r._id || idx}>
                  <td className="px-4 py-2 border">{r.studentName || r.student?.name}</td>
                  <td className="px-4 py-2 border">{r.studentRollNo || r.student?.rollNo}</td>
                  <td className="px-4 py-2 border">{r.score} / {r.totalScore}</td>
                  <td className="px-4 py-2 border">{r.percentage}%</td>
                  <td className="px-4 py-2 border">{r.passed ? 'Pass' : 'Fail'}</td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={5} className="text-center py-4">No results found.</td></tr>
              )}
            </tbody>
          </table>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
              <span className="px-2">Page {page} of {totalPages}</span>
              <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminExamResults;
