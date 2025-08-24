
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const defaultQuestion = { question: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 };

const defaultInstructions = `Instructions for Test:\n\n- Read each question carefully.\n- Each question has only one correct answer.\n- No negative marking.\n- Click 'Save Questions' after adding or uploading.\n- Do not refresh the page during the test.\n`;

const AddQuestionsModal = ({ questions, setQuestions, handleQuestionChange, handleOptionChange, addQuestion, removeQuestion, handleAddQuestions, closeQModal, loading, currentTestId }) => {
  const [showCSV, setShowCSV] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvError, setCsvError] = useState('');
  // CSV upload handler (frontend only, backend endpoint needed)
  const handleCSVUpload = async (e) => {
    setCsvError('');
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('testId', currentTestId);
    try {
      const res = await api.post('/tests/upload-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data && res.data.test && res.data.test.questions) {
        setQuestions(res.data.test.questions);
        setShowCSV(false);
      } else {
        setCsvError('CSV uploaded but no questions found.');
      }
    } catch (err) {
      setCsvError((err.response && err.response.data && err.response.data.message) ? err.response.data.message : 'Failed to upload or parse CSV.');
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <>
          <h3 className="font-semibold mb-2">Add Questions</h3>
          <div className="flex gap-2 mb-4">
            <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={() => setShowCSV(true)}>Bulk Upload (CSV)</button>
            <button className="px-3 py-1 bg-purple-600 text-white rounded opacity-60 cursor-not-allowed" disabled>Generate with AI (Coming Soon)</button>
          </div>
          {/* CSV Upload Modal */}
          {showCSV && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <h4 className="font-semibold mb-2">CSV Format</h4>
                <p className="text-sm mb-2">Columns: <b>question, option1, option2, option3, option4, correctAnswer (1-4), points</b></p>
                <div className="bg-gray-100 p-2 rounded text-xs mb-2">
                  question,option1,option2,option3,option4,correctAnswer,points<br />
                  What is 2+2?,2,3,4,5,3,1<br />
                  Capital of France?,London,Berlin,Paris,Rome,3,1
                </div>
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="mb-2" />
                {csvError && <div className="text-red-600 text-xs mb-2">{csvError}</div>}
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => setShowCSV(false)}>Close</button>
                </div>
              </div>
            </div>
          )}
          {/* AI Generation UI */}
          <div className="mb-4">
            <textarea
              className="input w-full mb-2"
              placeholder="Enter topic or paragraph for AI to generate questions... (Coming soon)"
              value={''}
              rows={3}
              disabled
            />
            <button className="px-3 py-1 bg-purple-600 text-white rounded opacity-60 cursor-not-allowed" disabled>
              Generate (Coming Soon)
            </button>
            <div className="text-gray-600 text-xs mt-1">AI question generation will be released for Admin and Faculty soon in future versions.</div>
          </div>
          <form onSubmit={handleAddQuestions} className="space-y-4 flex-1 flex flex-col relative">
            <div className="overflow-y-auto flex-1 pr-2 pb-24" style={{ maxHeight: '55vh' }}>
              {questions.map((q, idx) => (
                <div key={idx} className="mb-4 p-3 border rounded bg-white">
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
              <button type="button" className="px-3 py-1 bg-green-500 text-white rounded mb-4" onClick={addQuestion}>Add Question</button>
            </div>
            <div className="flex space-x-2 mt-4 p-4 bg-white border-t sticky bottom-0 left-0 right-0 shadow-lg z-10">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>Save Questions</button>
              <button type="button" className="px-4 py-2 bg-gray-400 text-white rounded" onClick={closeQModal}>Cancel</button>
            </div>
          </form>
        </>
      </div>
    </div>
  );
};

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
      setSuccess('Exam window updated!');
      fetchTests();
    } catch (err) {
      setError('Failed to update window');
    } finally {
      setLoading(false);
    }
  };
  // Add missing handlers
  const openQModal = (testId) => {
    setCurrentTestId(testId);
    setShowQModal(true);
    // Optionally load questions from localStorage or API
  };

  const closeQModal = () => {
    setShowQModal(false);
    setQuestions([{ ...defaultQuestion }]);
    setCurrentTestId(null);
  };

  const handleQuestionChange = (idx, field, value) => {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const handleOptionChange = (qIdx, oIdx, value) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, options: q.options.map((opt, j) => j === oIdx ? value : opt) } : q));
  };

  const addQuestion = () => {
    setQuestions(qs => [...qs, { ...defaultQuestion }]);
  };

  const removeQuestion = (idx) => {
    setQuestions(qs => qs.length > 1 ? qs.filter((_, i) => i !== idx) : qs);
  };

  const handleAddQuestions = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.put(`/tests/${currentTestId}/questions`, { questions });
      setSuccess('Questions added!');
      if (currentTestId) localStorage.removeItem(`questions_${currentTestId}`);
      closeQModal();
      fetchTests();
    } catch (err) {
      setError('Failed to add questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.put(`/tests/${id}/deactivate`);
      setSuccess('Test deactivated!');
      fetchTests();
    } catch (err) {
      setError('Failed to deactivate test');
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
      {loading && (
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <svg className="animate-spin h-8 w-8 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <span>Loading tests...</span>
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}
      <div className="overflow-x-auto">
  <table className="min-w-full border text-sm" aria-label="All tests table">
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
              <tr key={test._id} tabIndex={0} aria-label={test.title}>
                <td className="border px-2 py-1">{test.title}</td>
                <td className="border px-2 py-1">{test.category}</td>
                <td className="border px-2 py-1">
                  <input type="datetime-local" value={test.startDate ? new Date(test.startDate).toISOString().slice(0,16) : ''} onChange={e => handleWindowUpdate(test._id, e.target.value, test.endDate)} aria-label="Start date and time" />
                  <span className="mx-1">to</span>
                  <input type="datetime-local" value={test.endDate ? new Date(test.endDate).toISOString().slice(0,16) : ''} onChange={e => handleWindowUpdate(test._id, test.startDate, e.target.value)} aria-label="End date and time" />
                </td>
                <td className="border px-2 py-1">{test.isActive ? 'Yes' : 'No'}</td>
                <td className="border px-2 py-1">
                  <button className="px-2 py-1 bg-yellow-500 text-white rounded mr-1" onClick={() => openQModal(test._id)} aria-label={`Add questions to ${test.title}`}>Add Questions</button>
                  {test.isActive ? (
                    <button className="px-2 py-1 bg-red-600 text-white rounded mr-1" onClick={() => handleDeactivate(test._id)} aria-label={`Stop test ${test.title}`}>Stop Test</button>
                  ) : (
                    <button className="px-2 py-1 bg-green-600 text-white rounded mr-1" onClick={() => handleActivate(test._id)} aria-label={`Start test ${test.title}`}>Start Test</button>
                  )}
                  <button className="px-2 py-1 bg-gray-800 text-white rounded" onClick={() => handleDeleteTest(test._id)} aria-label={`Delete test ${test.title}`}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Questions Modal */}
      {showQModal && (
        <AddQuestionsModal
          questions={questions}
          setQuestions={setQuestions}
          handleQuestionChange={handleQuestionChange}
          handleOptionChange={handleOptionChange}
          addQuestion={addQuestion}
          removeQuestion={removeQuestion}
          handleAddQuestions={handleAddQuestions}
          closeQModal={closeQModal}
          loading={loading}
          currentTestId={currentTestId}
        />
      )}

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
    </div>
  );
};

export default ManageTestsTable;
