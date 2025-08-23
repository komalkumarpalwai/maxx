
import React, { useEffect, useState } from 'react';
import api from '../services/api';

const defaultQuestion = { question: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 };

const ManageTestsTable = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQModal, setShowQModal] = useState(false);
  const [currentTestId, setCurrentTestId] = useState(null);
  const [questions, setQuestions] = useState([{ ...defaultQuestion }]);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/tests?all=1');
      setTests(res.data.tests || []);
    } catch (err) {
      setError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleWindowUpdate = async (id, startDate, endDate) => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.put(`/tests/${id}`, { startDate, endDate });
      setSuccess('Exam window updated!');
      fetchTests();
    } catch (err) {
      setError('Failed to update window');
    } finally {
      setLoading(false);
    }
  };

  const [windowModal, setWindowModal] = useState({ open: false, testId: null, start: '', end: '' });

  const handleActivate = (id) => {
    const test = tests.find(t => t._id === id);
    if (!test.startDate || !test.endDate) {
      setWindowModal({ open: true, testId: id, start: '', end: '' });
    } else {
      doActivate(id, test.startDate, test.endDate);
    }
  };

  const doActivate = async (id, startDate, endDate) => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.put(`/tests/${id}/activate`, { startDate, endDate });
      setSuccess('Test started!');
      fetchTests();
    } catch (err) {
      setError('Failed to start test');
    } finally {
      setLoading(false);
      setWindowModal({ open: false, testId: null, start: '', end: '' });
    }
  };

  const handleDeactivate = async (id) => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.put(`/tests/${id}/deactivate`);
      setSuccess('Test stopped!');
      fetchTests();
    } catch (err) {
      setError('Failed to stop test');
    } finally {
      setLoading(false);
    }
  };

  const openQModal = (testId) => {
    setCurrentTestId(testId);
    // Try to load from localStorage
    const saved = localStorage.getItem(`questions_${testId}`);
    if (saved) {
      try {
        setQuestions(JSON.parse(saved));
      } catch {
        setQuestions([{ ...defaultQuestion }]);
      }
    } else {
      setQuestions([{ ...defaultQuestion }]);
    }
    setShowQModal(true);
  };
  const closeQModal = () => {
    setShowQModal(false);
    setCurrentTestId(null);
    setQuestions([{ ...defaultQuestion }]);
  };
  const handleQuestionChange = (idx, field, value) => {
    setQuestions(qs => {
      const updated = qs.map((q, i) => i === idx ? { ...q, [field]: value } : q);
      if (currentTestId) localStorage.setItem(`questions_${currentTestId}`, JSON.stringify(updated));
      return updated;
    });
  };
  const handleOptionChange = (qIdx, oIdx, value) => {
    setQuestions(qs => {
      const updated = qs.map((q, i) => i === qIdx ? { ...q, options: q.options.map((opt, j) => j === oIdx ? value : opt) } : q);
      if (currentTestId) localStorage.setItem(`questions_${currentTestId}`, JSON.stringify(updated));
      return updated;
    });
  };
  const addQuestion = () => setQuestions(qs => {
    const updated = [...qs, { ...defaultQuestion }];
    if (currentTestId) localStorage.setItem(`questions_${currentTestId}`, JSON.stringify(updated));
    return updated;
  });
  const removeQuestion = idx => setQuestions(qs => {
    const updated = qs.length > 1 ? qs.filter((_, i) => i !== idx) : qs;
    if (currentTestId) localStorage.setItem(`questions_${currentTestId}`, JSON.stringify(updated));
    return updated;
  });

  const handleAddQuestions = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.put(`/tests/${currentTestId}/questions`, { questions });
      setSuccess('Questions added!');
      // Remove from localStorage after successful save
      if (currentTestId) localStorage.removeItem(`questions_${currentTestId}`);
      closeQModal();
      fetchTests();
    } catch (err) {
      setError('Failed to add questions');
    } finally {
      setLoading(false);
    }
  };

  // Delete test handler
  const handleDeleteTest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.delete(`/tests/${id}`);
      setSuccess('Test deleted successfully!');
      fetchTests();
    } catch (err) {
      setError('Failed to delete test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">All Tests</h3>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Title</th>
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Window</th>
              <th className="border px-2 py-1">Active</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(test => (
              <tr key={test._id}>
                <td className="border px-2 py-1">{test.title}</td>
                <td className="border px-2 py-1">{test.category}</td>
                <td className="border px-2 py-1">
                  <input type="datetime-local" value={test.startDate ? new Date(test.startDate).toISOString().slice(0,16) : ''} onChange={e => handleWindowUpdate(test._id, e.target.value, test.endDate)} />
                  <span className="mx-1">to</span>
                  <input type="datetime-local" value={test.endDate ? new Date(test.endDate).toISOString().slice(0,16) : ''} onChange={e => handleWindowUpdate(test._id, test.startDate, e.target.value)} />
                </td>
                <td className="border px-2 py-1">{test.isActive ? 'Yes' : 'No'}</td>
                <td className="border px-2 py-1">
                  <button className="px-2 py-1 bg-yellow-500 text-white rounded mr-1" onClick={() => openQModal(test._id)}>Add Questions</button>
                  {test.isActive ? (
                    <button className="px-2 py-1 bg-red-600 text-white rounded mr-1" onClick={() => handleDeactivate(test._id)}>Stop Test</button>
                  ) : (
                    <button className="px-2 py-1 bg-green-600 text-white rounded mr-1" onClick={() => handleActivate(test._id)}>Start Test</button>
                  )}
                  <button className="px-2 py-1 bg-gray-800 text-white rounded" onClick={() => handleDeleteTest(test._id)}>
                    Delete
                  </button>
      {/* Set Window Modal for Start Test */}
      {windowModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="font-semibold mb-2">Set Exam Window</h3>
            <div className="mb-4">
              <label className="block mb-1">Start Date & Time</label>
              <input type="datetime-local" className="input w-full" value={windowModal.start} onChange={e => setWindowModal(w => ({ ...w, start: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="block mb-1">End Date & Time</label>
              <input type="datetime-local" className="input w-full" value={windowModal.end} onChange={e => setWindowModal(w => ({ ...w, end: e.target.value }))} />
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => doActivate(windowModal.testId, windowModal.start, windowModal.end)}>Start Test</button>
              <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setWindowModal({ open: false, testId: null, start: '', end: '' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Questions Modal */}
      {showQModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
            <h3 className="font-semibold mb-2">Add Questions</h3>
            <form onSubmit={handleAddQuestions} className="space-y-4 flex-1 flex flex-col">
              <div className="overflow-y-auto flex-1 pr-2" style={{ maxHeight: '55vh' }}>
                {questions.map((q, idx) => (
                  <div key={idx} className="mb-4 p-3 border rounded">
                    <input className="input mb-2 w-full" placeholder={`Question ${idx+1}`} value={q.question} onChange={e => handleQuestionChange(idx, 'question', e.target.value)} required />
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {q.options.map((opt, oIdx) => (
                        <input key={oIdx} className="input" placeholder={`Option ${oIdx+1}`} value={opt} onChange={e => handleOptionChange(idx, oIdx, e.target.value)} required />
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <label>Correct Answer:</label>
                      <select value={q.correctAnswer} onChange={e => handleQuestionChange(idx, 'correctAnswer', Number(e.target.value))}>
                        {q.options.map((_, oIdx) => <option key={oIdx} value={oIdx}>{`Option ${oIdx+1}`}</option>)}
                      </select>
                      <label>Points:</label>
                      <input className="input w-20" type="number" min={1} value={q.points} onChange={e => handleQuestionChange(idx, 'points', Number(e.target.value))} />
                      <button type="button" className="ml-auto text-red-600" onClick={() => removeQuestion(idx)} disabled={questions.length === 1}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="px-3 py-1 bg-green-500 text-white rounded" onClick={addQuestion}>Add Question</button>
              <div className="flex space-x-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save Questions</button>
                <button type="button" className="px-4 py-2 bg-gray-400 text-white rounded" onClick={closeQModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTestsTable;
