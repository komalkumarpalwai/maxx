import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Single clean ViewQuestionsModal component (above ManageTestsTable)
function ViewQuestionsModal({ questions, testId, testTitle, onClose, fetchQuestions }) {
  const [editIdx, setEditIdx] = useState(null);
  const [editQ, setEditQ] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const startEdit = (q, idx) => {
    setEditIdx(idx);
    setEditQ({
      question: q.question,
      option1: q.options ? q.options[0] : q.option1,
      option2: q.options ? q.options[1] : q.option2,
      option3: q.options ? q.options[2] : q.option3,
      option4: q.options ? q.options[3] : q.option4,
      correctAnswer: (q.correctAnswer !== undefined && q.correctAnswer !== null) ? (Number(q.correctAnswer) + 1).toString() : '',
      points: q.points || 1
    });
    setMsg('');
  };
  const cancelEdit = () => { setEditIdx(null); setEditQ({}); setMsg(''); };
  const handleEditChange = (field, value) => setEditQ(q => ({ ...q, [field]: value }));
  const saveEdit = async (idx) => {
    setMsg('This feature will be released in version 2 of Maxx Solutions.');
    setSaving(false);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-y-auto border border-gray-200">
        <h3 className="font-semibold text-lg mb-4">Questions for: <span className="text-blue-700">{testTitle}</span></h3>
        {questions.length === 0 ? (
          <div className="text-gray-500">No questions found for this test. Please ensure that the duration is set correctly.</div>
        ) : (
          <ol className="list-decimal ml-5 space-y-3">
            {questions.map((q, idx) => (
              <li key={idx} className="mb-2">
                {editIdx === idx ? (
                  <div className="border rounded p-2 bg-gray-50">
                    <input className="input w-full mb-1" value={editQ.question} onChange={e => handleEditChange('question', e.target.value)} />
                    <div className="flex gap-2 mb-1">
                      <input className="input flex-1" placeholder="Option 1" value={editQ.option1} onChange={e => handleEditChange('option1', e.target.value)} />
                      <input className="input flex-1" placeholder="Option 2" value={editQ.option2} onChange={e => handleEditChange('option2', e.target.value)} />
                      <input className="input flex-1" placeholder="Option 3" value={editQ.option3} onChange={e => handleEditChange('option3', e.target.value)} />
                      <input className="input flex-1" placeholder="Option 4" value={editQ.option4} onChange={e => handleEditChange('option4', e.target.value)} />
                    </div>
                    <div className="flex gap-2 mb-1">
                      <select className="input w-32" value={editQ.correctAnswer} onChange={e => handleEditChange('correctAnswer', e.target.value)}>
                        <option value="">Correct Answer</option>
                        <option value="1">Option 1</option>
                        <option value="2">Option 2</option>
                        <option value="3">Option 3</option>
                        <option value="4">Option 4</option>
                      </select>
                      <input className="input w-20" type="number" min="1" value={editQ.points} onChange={e => handleEditChange('points', e.target.value)} placeholder="Points" />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => saveEdit(idx)} disabled={saving}>Save</button>
                      <button className="px-3 py-1 bg-gray-400 text-white rounded" onClick={cancelEdit} disabled={saving}>Cancel</button>
                    </div>
                    {msg && <div className="text-xs text-red-600 mt-1">{msg}</div>}
                  </div>
                ) : (
                  <>
                    <div className="font-medium">Q{idx + 1}: {q.question}</div>
                    <ul className="ml-4 text-sm">
                      <li>A. {q.options ? q.options[0] : q.option1}</li>
                      <li>B. {q.options ? q.options[1] : q.option2}</li>
                      <li>C. {q.options ? q.options[2] : q.option3}</li>
                      <li>D. {q.options ? q.options[3] : q.option4}</li>
                    </ul>
                    <div className="text-xs text-gray-500 mt-1">Correct: Option {(q.correctAnswer !== undefined && q.correctAnswer !== null) ? (Number(q.correctAnswer) + 1) : ''} | Points: {q.points}</div>
                    <button className="mt-1 px-2 py-1 bg-yellow-500 text-white rounded text-xs" onClick={() => startEdit(q, idx)}>Edit</button>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
        <button className="mt-6 px-4 py-2 bg-gray-400 text-white rounded self-end" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function AddQuestionsModal({ closeQModal, handleAddQuestions, loading }) {
  const [showCSV, setShowCSV] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [csvQuestions, setCsvQuestions] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [manualQuestions, setManualQuestions] = useState([
    { question: '', option1: '', option2: '', option3: '', option4: '', correctAnswer: '', points: '' }
  ]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [manualError, setManualError] = useState('');
  // Parse CSV string to array of question objects
  function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      header.forEach((h, i) => {
        obj[h] = values[i] ? values[i].trim() : '';
      });
      return obj;
    });
  }

  const handleCSVUpload = async (e) => {
    setCsvError('');
    setCsvQuestions([]);
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setCsvError('Please upload a .csv file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const questions = parseCSV(text);
        if (!questions.length) {
          setCsvError('No valid questions found in CSV.');
        } else {
          setCsvQuestions(questions);
        }
      } catch (err) {
        setCsvError('Failed to parse CSV.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveCSVQuestions = async () => {
    setCsvError('');
    setCsvLoading(true);
    // Validate questions
    const validQuestions = csvQuestions.filter(q => q.question && q.option1 && q.option2 && q.option3 && q.option4 && q.correctAnswer && q.points);
    if (!validQuestions.length) {
      setCsvError('No valid questions to save.');
      setCsvLoading(false);
      return;
    }
    try {
      await handleAddQuestions(validQuestions);
      setShowCSV(false);
      setCsvQuestions([]);
      closeQModal();
    } catch (err) {
      setCsvError('Failed to save questions.');
    } finally {
      setCsvLoading(false);
    }
  };
  const handleManualChange = (field, value) => {
    setManualQuestions(qs => qs.map((q, i) => i === currentIdx ? { ...q, [field]: value } : q));
  };
  const goNext = () => {
    if (currentIdx === manualQuestions.length - 1) {
      setManualQuestions(qs => [...qs, { question: '', option1: '', option2: '', option3: '', option4: '', correctAnswer: '', points: '' }]);
    }
    setCurrentIdx(idx => idx + 1);
  };
  const goPrev = () => {
    if (currentIdx > 0) setCurrentIdx(idx => idx - 1);
  };
  const removeCurrent = () => {
    if (manualQuestions.length === 1) return;
    setManualQuestions(qs => {
      const arr = qs.filter((_, i) => i !== currentIdx);
      return arr;
    });
    setCurrentIdx(idx => (idx > 0 ? idx - 1 : 0));
  };
  const saveManualQuestions = async () => {
    setManualError('');
    const validQuestions = manualQuestions.filter(q => q.question.trim());
    if (validQuestions.length === 0) {
      setManualError('Please add at least one question.');
      return;
    }
    // Validate all fields for each question
    for (let i = 0; i < validQuestions.length; i++) {
      const q = validQuestions[i];
      if (!q.option1 || !q.option2 || !q.option3 || !q.option4) {
        setManualError(`All options are required for question ${i + 1}`);
        return;
      }
      if (!q.correctAnswer) {
        setManualError(`Correct answer is required for question ${i + 1}`);
        return;
      }
    }
    await handleAddQuestions(validQuestions);
    closeQModal();
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md border border-gray-200 shadow-xl flex flex-col" style={{ minWidth: 350 }}>
        <h2 className="font-semibold text-xl mb-3 text-gray-800">Add Questions</h2>
        <div className="flex gap-2 mb-4">
          <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={() => setShowCSV(true)}>Bulk Upload (CSV)</button>
          <button className="px-3 py-1 bg-gray-300 text-gray-600 rounded cursor-not-allowed" disabled>Generate with AI (Coming Soon)</button>
        </div>
        {showCSV && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg w-full max-w-md border border-gray-200">
              <h4 className="font-semibold mb-2 text-gray-700">CSV Format</h4>
              <p className="text-xs mb-2">Columns: <b>question, option1, option2, option3, option4, correctAnswer (1-4), points</b></p>
              <div className="bg-gray-100 p-2 rounded text-xs mb-2">
                question,option1,option2,option3,option4,correctAnswer,points<br />
                What is 2+2?,2,3,4,5,3,1<br />
                Capital of France?,London,Berlin,Paris,Rome,3,1
              </div>
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="mb-2" />
              {csvQuestions.length > 0 && (
                <div className="mb-2 text-xs text-green-700">{csvQuestions.length} questions ready to save.</div>
              )}
              {csvError && <div className="text-red-600 text-xs mb-2">{csvError}</div>}
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={handleSaveCSVQuestions} disabled={csvLoading || !csvQuestions.length}>{csvLoading ? 'Saving...' : 'Save'}</button>
                <button className="px-3 py-1 bg-gray-500 text-white rounded" onClick={() => setShowCSV(false)} disabled={csvLoading}>Close</button>
              </div>
            </div>
          </div>
        )}
        <div className="mb-4">
          <h3 className="font-semibold text-base mb-2 text-gray-700">Create Questions Manually</h3>
          <div className="border border-gray-200 rounded p-3 bg-white flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 items-center mb-2">
              <input className="input flex-1 border-gray-300 text-sm" placeholder="Question" value={manualQuestions[currentIdx].question} onChange={e => handleManualChange('question', e.target.value)} />
              <input className="input w-20 border-gray-300 text-sm" placeholder="Points" type="number" value={manualQuestions[currentIdx].points} onChange={e => handleManualChange('points', e.target.value)} />
              <button className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs" onClick={removeCurrent} disabled={manualQuestions.length === 1}>Remove</button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input className="input flex-1 border-gray-300 text-sm" placeholder="Option 1" value={manualQuestions[currentIdx].option1} onChange={e => handleManualChange('option1', e.target.value)} />
              <input className="input flex-1 border-gray-300 text-sm" placeholder="Option 2" value={manualQuestions[currentIdx].option2} onChange={e => handleManualChange('option2', e.target.value)} />
              <input className="input flex-1 border-gray-300 text-sm" placeholder="Option 3" value={manualQuestions[currentIdx].option3} onChange={e => handleManualChange('option3', e.target.value)} />
              <input className="input flex-1 border-gray-300 text-sm" placeholder="Option 4" value={manualQuestions[currentIdx].option4} onChange={e => handleManualChange('option4', e.target.value)} />
              <select className="input w-28 border-gray-300 text-sm" value={manualQuestions[currentIdx].correctAnswer} onChange={e => handleManualChange('correctAnswer', e.target.value)}>
                <option value="">Correct</option>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
                <option value="3">Option 3</option>
                <option value="4">Option 4</option>
              </select>
            </div>
            <div className="flex justify-between mt-2">
              <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm" onClick={goPrev} disabled={currentIdx === 0}>Previous</button>
              <span className="text-xs text-gray-500">Question {currentIdx + 1} of {manualQuestions.length}</span>
              <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm" onClick={goNext}>Next</button>
            </div>
          </div>
          <div className="mt-2">
            <h4 className="font-semibold text-xs mb-1 text-gray-600">Summary</h4>
            <ul className="text-xs text-gray-700 list-decimal ml-5">
              {manualQuestions.filter(q => q.question.trim()).map((q, i) => (
                <li key={i} className={i === currentIdx ? 'font-bold text-blue-600' : ''}>{q.question.slice(0, 40) || 'Untitled'}</li>
              ))}
            </ul>
          </div>
          {manualError && <div className="text-red-600 text-xs mt-2">{manualError}</div>}
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={saveManualQuestions} disabled={loading}>Save</button>
          <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded" onClick={closeQModal}>Cancel</button>
        </div>
      </div>
    </div>
  );
}


function ManageTestsTable() {
  const [viewQModal, setViewQModal] = useState({ open: false, questions: [], testTitle: '' });
  // Bulk selection state
  const [selectedTests, setSelectedTests] = useState([]);
  // ...existing code...

  // ...existing code...
  const [tests, setTests] = useState([]);
  const allSelected = tests.length > 0 && selectedTests.length === tests.length;
  const handleSelectTest = (testId) => {
    setSelectedTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };
  const handleSelectAll = () => {
    if (allSelected) setSelectedTests([]);
    else setSelectedTests(tests.map((t) => t._id));
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedTests.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedTests.length} selected test(s)? This action cannot be undone.`)) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      for (const id of selectedTests) {
        await api.delete(`/tests/${id}`);
      }
      setSuccess('Selected tests deleted!');
      setSelectedTests([]);
      fetchTests();
    } catch (err) {
      setError('Bulk delete failed');
    } finally {
      setLoading(false);
    }
  };

  // Bulk start (activate)
  const handleBulkStart = () => {
    if (selectedTests.length === 0) return;
    if (!window.confirm(`Are you sure you want to start ${selectedTests.length} selected test(s)?`)) return;
    // Open window modal for all selected tests (one by one)
    setBulkStartQueue([...selectedTests]);
    setBulkStartModal({ open: true, testId: selectedTests[0], idx: 0, start: '', end: '', duration: '' });
  };
  // Bulk start modal state
  const [bulkStartModal, setBulkStartModal] = useState({ open: false, testId: null, idx: 0, start: '', end: '', duration: '' });
  const [bulkStartQueue, setBulkStartQueue] = useState([]);
  const handleBulkStartNext = async () => {
    const { testId, start, end, duration, idx } = bulkStartModal;
    setLoading(true); setError('');
    try {
      const mins = parseInt(duration, 10);
      if (!start || !end || isNaN(mins) || mins < 1) {
        setError('Please fill all fields for this test.');
        setLoading(false);
        return;
      }
      await api.put(`/tests/${testId}/activate`, { startDate: start, endDate: end, duration: mins });
      // Move to next
      if (idx + 1 < bulkStartQueue.length) {
        setBulkStartModal({ open: true, testId: bulkStartQueue[idx + 1], idx: idx + 1, start: '', end: '', duration: '' });
      } else {
        setBulkStartModal({ open: false, testId: null, idx: 0, start: '', end: '', duration: '' });
        setBulkStartQueue([]);
        setSuccess('Selected tests started!');
        setSelectedTests([]);
        fetchTests();
      }
    } catch (err) {
      setError('Failed to start test');
    } finally {
      setLoading(false);
    }
  };
  const handleBulkStartCancel = () => {
    setBulkStartModal({ open: false, testId: null, idx: 0, start: '', end: '', duration: '' });
    setBulkStartQueue([]);
  };

  const openViewQModal = async (test) => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/tests/${test._id}/admin-questions`);
      setViewQModal({ open: true, questions: res.data.questions || [], testTitle: test.title });
    } catch (err) {
      setError('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };
  const closeViewQModal = () => setViewQModal({ open: false, questions: [], testTitle: '' });
  // ...existing code...
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQModal, setShowQModal] = useState(false);
  const [currentTestId, setCurrentTestId] = useState(null);
  const [branchOptions, setBranchOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);

  useEffect(() => {
    // Fetch allowed branches/years from backend
    const fetchRegistrationOptions = async () => {
      try {
        const res = await api.get('/meta/registration-options');
        setBranchOptions(res.data.branches || []);
        setYearOptions(res.data.years || []);
      } catch (err) {
        setBranchOptions([]);
        setYearOptions([]);
      }
    };
    fetchRegistrationOptions();
  }, []);
  const [editModal, setEditModal] = useState({ open: false, test: null, form: {} });
  const [windowModal, setWindowModal] = useState({ open: false, testId: null, start: '', end: '', duration: '' });

  // No need to fetch branches/years from users; use enums above

  const fetchTests = async () => {
    setLoading(true); setError('');
    try {
      // Fetch all tests for admin (not just active ones)
      const res = await api.get('/tests?all=1');
      setTests(res.data.tests || []);
    } catch (err) {
      setError('Failed to fetch tests');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchTests(); }, []);

  const openQModal = (testId) => { setCurrentTestId(testId); setShowQModal(true); };
  const closeQModal = () => { setShowQModal(false); setCurrentTestId(null); };

  const openEditModal = (test) => {
    setEditModal({
      open: true,
      test,
      form: {
        requireAllQuestions: test.requireAllQuestions ?? true,
        allowNavigation: test.allowNavigation ?? true,
        deviceRestriction: test.deviceRestriction || 'both',
        allowedBranches: test.allowedBranches || [],
        allowedYears: test.allowedYears || [],
        tabSwitchLimit: test.tabSwitchLimit ?? 3
      }
    });
  };
  const closeEditModal = () => setEditModal({ open: false, test: null, form: {} });
  const handleEditChange = (field, value) => {
    setEditModal((prev) => ({ ...prev, form: { ...prev.form, [field]: value } }));
  };
  const handleEditSave = async () => {
    setLoading(true); setError(''); setSuccess('');
    if (!editModal.form.tabSwitchLimit || editModal.form.tabSwitchLimit < 1) {
      setError('Tab Switch Limit must be at least 1'); setLoading(false); return;
    }
    if (!editModal.form.allowedBranches || editModal.form.allowedBranches.length === 0) {
      setError('Select at least one allowed branch'); setLoading(false); return;
    }
    if (!editModal.form.allowedYears || editModal.form.allowedYears.length === 0) {
      setError('Select at least one allowed year'); setLoading(false); return;
    }
    try {
      await api.put(`/tests/${editModal.test._id}`, editModal.form);
      setSuccess('Test settings updated!');
      closeEditModal();
      fetchTests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update test settings');
    } finally {
      setLoading(false);
    }
  };

  const doActivate = async (testId, start, end, duration) => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const mins = parseInt(duration, 10);
      if (!start || !end) {
        setError('Please select both start and end date/time');
        setLoading(false);
        return;
      }
      if (isNaN(mins) || mins < 1) {
        setError('Please enter a valid duration (minutes)');
        setLoading(false);
        return;
      }
      await api.put(`/tests/${testId}/activate`, { startDate: start, endDate: end, duration: mins });
      setSuccess('Test activated!');
      setWindowModal({ open: false, testId: null, start: '', end: '', duration: '' });
      fetchTests();
    } catch (err) {
      // Show backend validation error if present
      const backendMsg = err.response?.data?.message;
      setError(backendMsg || 'Failed to activate test');
    } finally {
      setLoading(false);
    }
  };
  const handleActivate = (testId) => {
    setWindowModal({ open: true, testId, start: '', end: '', duration: '' });
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

  const handleAddQuestions = async (questions) => {
    if (!currentTestId || !questions || questions.length === 0) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.put(`/tests/${currentTestId}/questions`, { questions });
      setSuccess('Questions added!');
      fetchTests();
    } catch (err) {
      setError('Failed to add questions');
    } finally {
      setLoading(false);
    }
  };
const [showGuide, setShowGuide] = useState(true);
  return (

    
    <div>
     

      <h3 className="font-semibold mb-2">All Tests</h3>
      {loading && (
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <svg className="animate-spin h-8 w-8 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>Loading tests...</span>
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}


      {/* Bulk Actions Bar */}
      <div className="flex gap-2 mb-2">
        <button className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50" onClick={handleBulkDelete} disabled={selectedTests.length === 0}>Bulk Delete</button>
        <button className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50" onClick={handleBulkStart} disabled={selectedTests.length === 0}>Bulk Start</button>
        <span className="text-xs text-gray-500">{selectedTests.length} selected</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm" aria-label="All tests table">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">
                <input type="checkbox" checked={allSelected} onChange={handleSelectAll} aria-label="Select all tests" />
              </th>
              <th className="border px-2 py-1">Title</th>
              <th className="border px-2 py-1">Questions</th>
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Window</th>
              <th className="border px-2 py-1">Active</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-8">No tests found. Please create a test in the Create Test tab.</td>
              </tr>
            ) : (
              tests.map(test => {
                const questionCount = Array.isArray(test.questions) ? test.questions.length : (test.totalQuestions || 0);
                return (
                  <tr key={test._id} tabIndex={0} aria-label={test.title}>
                    <td className="border px-2 py-1 text-center">
                      <input type="checkbox" checked={selectedTests.includes(test._id)} onChange={() => handleSelectTest(test._id)} aria-label={`Select test ${test.title}`} />
                    </td>
                    <td className="border px-2 py-1">
                      <div className="font-semibold">{test.title}</div>
                    </td>
                    <td className="border px-2 py-1 text-center">{questionCount}</td>
                    <td className="border px-2 py-1">{test.category}</td>
                    <td className="border px-2 py-1">
                      {test.startDate && test.endDate ? (
                        <span>{new Date(test.startDate).toLocaleString()} to {new Date(test.endDate).toLocaleString()}<br />
                          <span className="text-xs text-gray-500">Duration: {test.duration ? test.duration + ' min' : Math.round((new Date(test.endDate) - new Date(test.startDate))/60000) + ' min'}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="border px-2 py-1">{test.isActive ? 'Yes' : 'No'}</td>
                   <td className="border px-2 py-1">
  <div className="flex flex-wrap gap-1 items-center">
    <button className="px-2 py-1 bg-yellow-500 text-white rounded text-xs" onClick={() => openQModal(test._id)} aria-label={`Add questions to ${test.title}`}>Add</button>
    <button className="px-2 py-1 bg-gray-500 text-white rounded text-xs" onClick={() => openViewQModal(test)} aria-label={`View questions for ${test.title}`}>View</button>
    <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs" onClick={() => openEditModal(test)} aria-label={`Edit settings for ${test.title}`}>Edit</button>
    {test.isActive ? (
      <button className="px-2 py-1 bg-red-600 text-white rounded text-xs" onClick={() => {
  if (window.confirm(`Are you sure you want to stop the test "${test.title}"?`)) handleDeactivate(test._id);
      }} aria-label={`Stop test ${test.title}`}>Stop</button>
    ) : (
      <button className={`px-2 py-1 rounded text-xs ${questionCount === 0 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-600 text-white'}`}
        onClick={() => {
          if (questionCount === 0) return;
          if (window.confirm(`Are you sure you want to start the test "${test.title}"?`)) handleActivate(test._id);
        }}
        aria-label={`Start test ${test.title}`}
        disabled={questionCount === 0}
      >
        Start
      </button>
    )}
    <button className="px-2 py-1 bg-gray-800 text-white rounded text-xs" onClick={() => handleDeleteTest(test._id)} aria-label={`Delete test ${test.title}`}>Delete</button>
  </div>
</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Start Modal (step through each selected test) */}
      {bulkStartModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="font-semibold mb-2">Set Exam Window & Duration for Test {bulkStartModal.idx + 1} of {bulkStartQueue.length}</h3>
            <div className="mb-4">
              <label className="block mb-1">Start Date & Time</label>
              <input type="datetime-local" className="input w-full" value={bulkStartModal.start} onChange={e => setBulkStartModal(w => ({ ...w, start: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="block mb-1">End Date & Time</label>
              <input type="datetime-local" className="input w-full" value={bulkStartModal.end} onChange={e => setBulkStartModal(w => ({ ...w, end: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Duration (minutes)</label>
              <input type="number" min="1" className="input w-full" value={bulkStartModal.duration} onChange={e => setBulkStartModal(w => ({ ...w, duration: e.target.value }))} placeholder="Enter duration in minutes" />
            </div>
            <div className="flex space-x-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleBulkStartNext}
                disabled={!bulkStartModal.start || !bulkStartModal.end || !bulkStartModal.duration || loading}
              >
                {bulkStartModal.idx + 1 === bulkStartQueue.length ? 'Start Last Test' : 'Start & Next'}
              </button>
              <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={handleBulkStartCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Test Settings Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="font-semibold mb-4">Edit Test Settings</h3>
            <div className="mb-3">
              <label className="block font-medium mb-1">Require All Questions to be Attempted</label>
              <input type="checkbox" checked={editModal.form.requireAllQuestions} onChange={e => handleEditChange('requireAllQuestions', e.target.checked)} />
              <span className="ml-2">ON</span>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Allow Navigation Between Questions</label>
              <input type="checkbox" checked={editModal.form.allowNavigation} onChange={e => handleEditChange('allowNavigation', e.target.checked)} />
              <span className="ml-2">ON</span>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Tab Switch Limit</label>
              <input type="number" min={1} max={10} value={editModal.form.tabSwitchLimit} onChange={e => handleEditChange('tabSwitchLimit', Number(e.target.value))} className="input w-20 ml-2" />
              <span className="ml-2 text-xs">(Default: 3, 4th switch auto-submits)</span>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Device Restriction</label>
              <div className="flex gap-2">
                <label><input type="radio" name="deviceRestriction" value="mobile" checked={editModal.form.deviceRestriction === 'mobile'} onChange={e => handleEditChange('deviceRestriction', e.target.value)} /> Mobile Only</label>
                <label><input type="radio" name="deviceRestriction" value="desktop" checked={editModal.form.deviceRestriction === 'desktop'} onChange={e => handleEditChange('deviceRestriction', e.target.value)} /> Laptop/Desktop Only</label>
                <label><input type="radio" name="deviceRestriction" value="both" checked={editModal.form.deviceRestriction === 'both'} onChange={e => handleEditChange('deviceRestriction', e.target.value)} /> Both</label>
              </div>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Allowed Branches</label>
              <select multiple className="input w-full" value={editModal.form.allowedBranches} onChange={e => {
                const values = Array.from(e.target.selectedOptions, o => o.value);
                // If 'ALL' is selected, override all others
                if (values.includes('__ALL__')) {
                  handleEditChange('allowedBranches', ['__ALL__']);
                } else {
                  handleEditChange('allowedBranches', values);
                }
              }}>
                <option value="__ALL__">All Branches (Allow all students)</option>
                {branchOptions.map(branch => <option key={branch} value={branch}>{branch}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Allowed Years</label>
              <select multiple className="input w-full" value={editModal.form.allowedYears} onChange={e => {
                const values = Array.from(e.target.selectedOptions, o => o.value);
                if (values.includes('__ALL__')) {
                  handleEditChange('allowedYears', ['__ALL__']);
                } else {
                  handleEditChange('allowedYears', values);
                }
              }}>
                <option value="__ALL__">All Years (Allow all students)</option>
                {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleEditSave} disabled={loading}>Save</button>
              <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={closeEditModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Questions Modal */}
      {showQModal && (
        <AddQuestionsModal
          closeQModal={closeQModal}
          handleAddQuestions={handleAddQuestions}
          loading={loading}
        />
      )}

      {/* View Questions Modal */}
      {viewQModal.open && (
        <ViewQuestionsModal
          questions={viewQModal.questions}
          testId={viewQModal.testId}
          testTitle={viewQModal.testTitle}
          onClose={closeViewQModal}
          fetchQuestions={openViewQModal}
        />
      )}

      {/* Set Window Modal for Start Test */}
      {windowModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="font-semibold mb-2">Set Exam Window & Duration</h3>
            <div className="mb-4">
              <label className="block mb-1">Start Date & Time</label>
              <input type="datetime-local" className="input w-full" value={windowModal.start} onChange={e => setWindowModal(w => ({ ...w, start: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="block mb-1">End Date & Time</label>
              <input type="datetime-local" className="input w-full" value={windowModal.end} onChange={e => setWindowModal(w => ({ ...w, end: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Duration (minutes)</label>
              <input type="number" min="1" className="input w-full" value={windowModal.duration} onChange={e => setWindowModal(w => ({ ...w, duration: e.target.value }))} placeholder="Enter duration in minutes" />
            </div>
            <div className="flex space-x-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => doActivate(windowModal.testId, windowModal.start, windowModal.end, windowModal.duration)}
                disabled={!windowModal.start || !windowModal.end || !windowModal.duration || loading}
              >
                Start Test
              </button>
              <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setWindowModal({ open: false, testId: null, start: '', end: '', duration: '' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );




function ManageTestsTable() {
  const [viewQModal, setViewQModal] = useState({ open: false, questions: [], testTitle: '' });

  const openViewQModal = async (test) => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/tests/${test._id}/admin-questions`);
      setViewQModal({ open: true, questions: res.data.questions || [], testTitle: test.title });
    } catch (err) {
      setError('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };
  const closeViewQModal = () => setViewQModal({ open: false, questions: [], testTitle: '' });
  const [tests, setTests] = useState([]);
  const allSelected = tests.length > 0 && selectedTests.length === tests.length;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQModal, setShowQModal] = useState(false);
  const [currentTestId, setCurrentTestId] = useState(null);
  const [branchOptions, setBranchOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);

  useEffect(() => {
    // Fetch allowed branches/years from backend
    const fetchRegistrationOptions = async () => {
      try {
        const res = await api.get('/meta/registration-options');
        setBranchOptions(res.data.branches || []);
        setYearOptions(res.data.years || []);
      } catch (err) {
        setBranchOptions([]);
        setYearOptions([]);
      }
    };
    fetchRegistrationOptions();
  }, []);
  const [editModal, setEditModal] = useState({ open: false, test: null, form: {} });
  const [windowModal, setWindowModal] = useState({ open: false, testId: null, start: '', end: '', duration: '' });

  // No need to fetch branches/years from users; use enums above

  const fetchTests = async () => {
    setLoading(true); setError('');
    try {
      // Fetch all tests for admin (not just active ones)
      const res = await api.get('/tests?all=1');
      setTests(res.data.tests || []);
    } catch (err) {
      setError('Failed to fetch tests');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchTests(); }, []);

  const openQModal = (testId) => { setCurrentTestId(testId); setShowQModal(true); };
  const closeQModal = () => { setShowQModal(false); setCurrentTestId(null); };

  const openEditModal = (test) => {
    setEditModal({
      open: true,
      test,
      form: {
        requireAllQuestions: test.requireAllQuestions ?? true,
        allowNavigation: test.allowNavigation ?? true,
        deviceRestriction: test.deviceRestriction || 'both',
        allowedBranches: test.allowedBranches || [],
        allowedYears: test.allowedYears || [],
        tabSwitchLimit: test.tabSwitchLimit ?? 3
      }
    });
  };
  const closeEditModal = () => setEditModal({ open: false, test: null, form: {} });
  const handleEditChange = (field, value) => {
    setEditModal((prev) => ({ ...prev, form: { ...prev.form, [field]: value } }));
  };
  const handleEditSave = async () => {
    setLoading(true); setError(''); setSuccess('');
    if (!editModal.form.tabSwitchLimit || editModal.form.tabSwitchLimit < 1) {
      setError('Tab Switch Limit must be at least 1'); setLoading(false); return;
    }
    if (!editModal.form.allowedBranches || editModal.form.allowedBranches.length === 0) {
      setError('Select at least one allowed branch'); setLoading(false); return;
    }
    if (!editModal.form.allowedYears || editModal.form.allowedYears.length === 0) {
      setError('Select at least one allowed year'); setLoading(false); return;
    }
    try {
      await api.put(`/tests/${editModal.test._id}`, editModal.form);
      setSuccess('Test settings updated!');
      closeEditModal();
      fetchTests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update test settings');
    } finally {
      setLoading(false);
    }
  };

  const doActivate = async (testId, start, end, duration) => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const mins = parseInt(duration, 10);
      if (!start || !end) {
        setError('Please select both start and end date/time');
        setLoading(false);
        return;
      }
      if (isNaN(mins) || mins < 1) {
        setError('Please enter a valid duration (minutes)');
        setLoading(false);
        return;
      }
      await api.put(`/tests/${testId}/activate`, { startDate: start, endDate: end, duration: mins });
      setSuccess('Test activated!');
      setWindowModal({ open: false, testId: null, start: '', end: '', duration: '' });
      fetchTests();
    } catch (err) {
      setError('Failed to activate test');
    } finally {
      setLoading(false);
    }
  };
  const handleActivate = (testId) => {
    setWindowModal({ open: true, testId, start: '', end: '', duration: '' });
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

  const handleAddQuestions = async (questions) => {
    if (!currentTestId || !questions || questions.length === 0) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.put(`/tests/${currentTestId}/questions`, { questions });
      setSuccess('Questions added!');
      fetchTests();
    } catch (err) {
      setError('Failed to add questions');
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
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
              <th className="border px-2 py-1">Questions</th>
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Window</th>
              <th className="border px-2 py-1">Active</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-8">No tests found. Please create a test in the Create Test tab.</td>
              </tr>
            ) : (
              tests.map(test => {
                const questionCount = Array.isArray(test.questions) ? test.questions.length : (test.totalQuestions || 0);
                return (
                  <tr key={test._id} tabIndex={0} aria-label={test.title}>
                    <td className="border px-2 py-1">
                      <div className="font-semibold">{test.title}</div>
                    </td>
                    <td className="border px-2 py-1 text-center">{questionCount}</td>
                    <td className="border px-2 py-1">{test.category}</td>
                    <td className="border px-2 py-1">
                      {test.startDate && test.endDate ? (
                        <span>{new Date(test.startDate).toLocaleString()} to {new Date(test.endDate).toLocaleString()}<br />
                          <span className="text-xs text-gray-500">Duration: {test.duration ? test.duration + ' min' : Math.round((new Date(test.endDate) - new Date(test.startDate))/60000) + ' min'}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="border px-2 py-1">{test.isActive ? 'Yes' : 'No'}</td>
                   <td className="border px-2 py-1">
  <div className="flex flex-wrap gap-1 items-center">
    <button className="px-2 py-1 bg-yellow-500 text-white rounded text-xs" onClick={() => openQModal(test._id)} aria-label={`Add questions to ${test.title}`}>Add</button>
    <button className="px-2 py-1 bg-gray-500 text-white rounded text-xs" onClick={() => openViewQModal(test)} aria-label={`View questions for ${test.title}`}>View</button>
    <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs" onClick={() => openEditModal(test)} aria-label={`Edit settings for ${test.title}`}>Edit</button>
    {test.isActive ? (
      <button className="px-2 py-1 bg-red-600 text-white rounded text-xs" onClick={() => {
        if (window.confirm(`Are you sure you want to stop the test "${test.title}"?`)) handleDeactivate(test._id);
      }} aria-label={`Stop test ${test.title}`}>Stop</button>
    ) : (
      <button className={`px-2 py-1 rounded text-xs ${questionCount === 0 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-600 text-white'}`}
        onClick={() => {
          if (questionCount === 0) return;
          if (window.confirm(`Are you sure you want to start the test "${test.title}"?`)) handleActivate(test._id);
        }}
        aria-label={`Start test ${test.title}`}
        disabled={questionCount === 0}
      >
        Start
      </button>
    )}
    <button className="px-2 py-1 bg-gray-800 text-white rounded text-xs" onClick={() => handleDeleteTest(test._id)} aria-label={`Delete test ${test.title}`}>Delete</button>
  </div>
</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Test Settings Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="font-semibold mb-4">Edit Test Settings</h3>
            <div className="mb-3">
              <label className="block font-medium mb-1">Require All Questions to be Attempted</label>
              <input type="checkbox" checked={editModal.form.requireAllQuestions} onChange={e => handleEditChange('requireAllQuestions', e.target.checked)} />
              <span className="ml-2">ON</span>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Allow Navigation Between Questions</label>
              <input type="checkbox" checked={editModal.form.allowNavigation} onChange={e => handleEditChange('allowNavigation', e.target.checked)} />
              <span className="ml-2">ON</span>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Tab Switch Limit</label>
              <input type="number" min={1} max={10} value={editModal.form.tabSwitchLimit} onChange={e => handleEditChange('tabSwitchLimit', Number(e.target.value))} className="input w-20 ml-2" />
              <span className="ml-2 text-xs">(Default: 3, 4th switch auto-submits)</span>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Device Restriction</label>
              <div className="flex gap-2">
                <label><input type="radio" name="deviceRestriction" value="mobile" checked={editModal.form.deviceRestriction === 'mobile'} onChange={e => handleEditChange('deviceRestriction', e.target.value)} /> Mobile Only</label>
                <label><input type="radio" name="deviceRestriction" value="desktop" checked={editModal.form.deviceRestriction === 'desktop'} onChange={e => handleEditChange('deviceRestriction', e.target.value)} /> Laptop/Desktop Only</label>
                <label><input type="radio" name="deviceRestriction" value="both" checked={editModal.form.deviceRestriction === 'both'} onChange={e => handleEditChange('deviceRestriction', e.target.value)} /> Both</label>
              </div>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Allowed Branches</label>
              <select multiple className="input w-full" value={editModal.form.allowedBranches} onChange={e => {
                const values = Array.from(e.target.selectedOptions, o => o.value);
                // If 'ALL' is selected, override all others
                if (values.includes('__ALL__')) {
                  handleEditChange('allowedBranches', ['__ALL__']);
                } else {
                  handleEditChange('allowedBranches', values);
                }
              }}>
                <option value="__ALL__">All Branches (Allow all students)</option>
                {branchOptions.map(branch => <option key={branch} value={branch}>{branch}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Allowed Years</label>
              <select multiple className="input w-full" value={editModal.form.allowedYears} onChange={e => {
                const values = Array.from(e.target.selectedOptions, o => o.value);
                if (values.includes('__ALL__')) {
                  handleEditChange('allowedYears', ['__ALL__']);
                } else {
                  handleEditChange('allowedYears', values);
                }
              }}>
                <option value="__ALL__">All Years (Allow all students)</option>
                {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleEditSave} disabled={loading}>Save</button>
              <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={closeEditModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Questions Modal */}
      {showQModal && (
        <AddQuestionsModal
          closeQModal={closeQModal}
          handleAddQuestions={handleAddQuestions}
          loading={loading}
        />
      )}

      {/* View Questions Modal */}
      {viewQModal.open && (
        <ViewQuestionsModal
          questions={viewQModal.questions}
          testId={viewQModal.testId}
          testTitle={viewQModal.testTitle}
          onClose={closeViewQModal}
          fetchQuestions={openViewQModal}
        />
      )}

      {/* Set Window Modal for Start Test */}
      {windowModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="font-semibold mb-2">Set Exam Window & Duration</h3>
            <div className="mb-4">
              <label className="block mb-1">Start Date & Time</label>
              <input type="datetime-local" className="input w-full" value={windowModal.start} onChange={e => setWindowModal(w => ({ ...w, start: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="block mb-1">End Date & Time</label>
              <input type="datetime-local" className="input w-full" value={windowModal.end} onChange={e => setWindowModal(w => ({ ...w, end: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Duration (minutes)</label>
              <input type="number" min="1" className="input w-full" value={windowModal.duration} onChange={e => setWindowModal(w => ({ ...w, duration: e.target.value }))} placeholder="Enter duration in minutes" />
            </div>
            <div className="flex space-x-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => doActivate(windowModal.testId, windowModal.start, windowModal.end, windowModal.duration)}
                disabled={!windowModal.start || !windowModal.end || !windowModal.duration || loading}
              >
                Start Test
              </button>
              <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setWindowModal({ open: false, testId: null, start: '', end: '', duration: '' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
}
export default ManageTestsTable;
