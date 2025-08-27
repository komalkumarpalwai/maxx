import React, { useState, useEffect, useMemo, useRef } from 'react';
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
          <div className="text-gray-500">No questions found for this test.</div>
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
  function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map((line, idx) => {
      const values = line.split(',');
      const obj = {};
      header.forEach((h, i) => { obj[h] = values[i] ? values[i].trim() : ''; });
      obj.__row = idx + 2;
      return obj;
    });
  }

  const handleCSVUpload = async (e) => {
    setCsvError('');
    setCsvQuestions([]);
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setCsvError('Please upload a .csv file.'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const questions = parseCSV(text);
        if (!questions.length) { setCsvError('No valid questions found in CSV.'); } else { setCsvQuestions(questions); }
      } catch (err) { setCsvError('Failed to parse CSV.'); }
    };
    reader.readAsText(file);
  };

  const handleSaveCSVQuestions = async () => {
    setCsvError('');
    setCsvLoading(true);
    const errors = [];
    const validQuestions = csvQuestions.filter(q => {
      const ok = q.question && q.option1 && q.option2 && q.option3 && q.option4 && q.correctAnswer && q.points;
      if (!ok) errors.push(q.__row);
      return ok;
    });
    if (!validQuestions.length) { setCsvError('No valid questions to save.'); setCsvLoading(false); return; }
    try { await handleAddQuestions(validQuestions); setShowCSV(false); setCsvQuestions([]); closeQModal(); }
    catch (err) { setCsvError('Failed to save questions.'); }
    finally { setCsvLoading(false); if (errors.length) setCsvError(`Skipped ${errors.length} invalid rows (lines: ${errors.join(', ')}).`); }
  };
  const handleManualChange = (field, value) => { setManualQuestions(qs => qs.map((q, i) => i === currentIdx ? { ...q, [field]: value } : q)); };
  const goNext = () => { if (currentIdx === manualQuestions.length - 1) { setManualQuestions(qs => [...qs, { question: '', option1: '', option2: '', option3: '', option4: '', correctAnswer: '', points: '' }]); } setCurrentIdx(idx => idx + 1); };
  const goPrev = () => { if (currentIdx > 0) setCurrentIdx(idx => idx - 1); };
  const removeCurrent = () => { if (manualQuestions.length === 1) return; setManualQuestions(qs => qs.filter((_, i) => i !== currentIdx)); setCurrentIdx(idx => (idx > 0 ? idx - 1 : 0)); };
  const saveManualQuestions = async () => {
    setManualError('');
    const validQuestions = manualQuestions.filter(q => q.question.trim());
    if (validQuestions.length === 0) { setManualError('Please add at least one question.'); return; }
    for (let i = 0; i < validQuestions.length; i++) { const q = validQuestions[i]; if (!q.option1 || !q.option2 || !q.option3 || !q.option4) { setManualError(`All options are required for question ${i + 1}`); return; } if (!q.correctAnswer) { setManualError(`Correct answer is required for question ${i + 1}`); return; } }
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
              {csvQuestions.length > 0 && (<div className="mb-2 text-xs text-green-700">{csvQuestions.length} questions ready to save.</div>)}
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

function StatusBadge({ status }) {
  const map = { active: 'bg-green-100 text-green-700', upcoming: 'bg-blue-100 text-blue-700', expired: 'bg-red-100 text-red-700', draft: 'bg-gray-100 text-gray-700', inactive: 'bg-gray-100 text-gray-700' };
  const cls = map[status] || 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-0.5 text-xs rounded ${cls}`}>{status || 'unknown'}</span>;
}

function ManageTestsTable() {
  const [viewQModal, setViewQModal] = useState({ open: false, questions: [], testTitle: '' });
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQModal, setShowQModal] = useState(false);
  const [currentTestId, setCurrentTestId] = useState(null);
  const [branchOptions, setBranchOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [showGuide, setShowGuide] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('startDate');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selected, setSelected] = useState({}); // id -> boolean
  const [bulkModal, setBulkModal] = useState({ open: false, start: '', end: '', duration: '' });

  const debounceTimersRef = useRef({}); // id -> timer
  const inlineDraftRef = useRef({}); // id -> {title, category, description}

  useEffect(() => {
    const fetchRegistrationOptions = async () => {
      try { const res = await api.get('/meta/registration-options'); setBranchOptions(res.data.branches || []); setYearOptions(res.data.years || []); }
      catch { setBranchOptions([]); setYearOptions([]); }
    };
    fetchRegistrationOptions();
  }, []);
  const [editModal, setEditModal] = useState({ open: false, test: null, form: {} });
  const [windowModal, setWindowModal] = useState({ open: false, testId: null, start: '', end: '', duration: '' });

  const fetchTests = async () => {
    setLoading(true); setError('');
    try { const res = await api.get('/tests?all=1'); setTests(res.data.tests || []); }
    catch { setError('Failed to fetch tests'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchTests(); }, []);

  const openQModal = (testId) => { setCurrentTestId(testId); setShowQModal(true); };
  const closeQModal = () => { setShowQModal(false); setCurrentTestId(null); };

  const openViewQModal = async (test) => {
    setLoading(true); setError('');
    try { const res = await api.get(`/tests/${test._id}/admin-questions`); setViewQModal({ open: true, questions: res.data.questions || [], testTitle: test.title }); }
    catch { setError('Failed to fetch questions'); }
    finally { setLoading(false); }
  };
  const closeViewQModal = () => setViewQModal({ open: false, questions: [], testTitle: '' });

  const openEditModal = (test) => { setEditModal({ open: true, test, form: { requireAllQuestions: test.requireAllQuestions ?? true, allowNavigation: test.allowNavigation ?? true, deviceRestriction: test.deviceRestriction || 'both', allowedBranches: test.allowedBranches || [], allowedYears: test.allowedYears || [], tabSwitchLimit: test.tabSwitchLimit ?? 3 } }); };
  const closeEditModal = () => setEditModal({ open: false, test: null, form: {} });
  const handleEditChange = (field, value) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, [field]: value } }));

  const handleEditSave = async () => {
    setLoading(true); setError(''); setSuccess('');
    if (!editModal.form.tabSwitchLimit || editModal.form.tabSwitchLimit < 1) { setError('Tab Switch Limit must be at least 1'); setLoading(false); return; }
    if (!editModal.form.allowedBranches || editModal.form.allowedBranches.length === 0) { setError('Select at least one allowed branch'); setLoading(false); return; }
    if (!editModal.form.allowedYears || editModal.form.allowedYears.length === 0) { setError('Select at least one allowed year'); setLoading(false); return; }
    try { await api.put(`/tests/${editModal.test._id}`, editModal.form); setSuccess('Test settings updated!'); closeEditModal(); fetchTests(); }
    catch (err) { setError(err.response?.data?.message || 'Failed to update test settings'); }
    finally { setLoading(false); }
  };

  const doActivate = async (testId, start, end, duration) => {
      const mins = parseInt(duration, 10);
    if (!start || !end) { setError('Please select both start and end date/time'); return; }
    if (isNaN(mins) || mins < 1) { setError('Please enter a valid duration (minutes)'); return; }
      await api.put(`/tests/${testId}/activate`, { startDate: start, endDate: end, duration: mins });
  };
  const handleActivate = (testId) => setWindowModal({ open: true, testId, start: '', end: '', duration: '' });
  const handleDeactivate = async (id) => { await api.put(`/tests/${id}/deactivate`); };

  const handleDeleteTest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) return;
    setLoading(true); setError(''); setSuccess('');
    try { await api.delete(`/tests/${id}`); setSuccess('Test deleted successfully!'); fetchTests(); }
    catch { setError('Failed to delete test'); }
    finally { setLoading(false); }
  };

  const handleAddQuestions = async (questions) => {
    if (!currentTestId || !questions || questions.length === 0) return;
    setLoading(true); setError(''); setSuccess('');
    try { await api.put(`/tests/${currentTestId}/questions`, { questions }); setSuccess('Questions added!'); fetchTests(); }
    catch { setError('Failed to add questions'); }
    finally { setLoading(false); }
  };

  const derived = useMemo(() => {
    let rows = [...tests];
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter(t => (t.title || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q));
    if (statusFilter !== 'all') rows = rows.filter(t => (t.status || (t.isActive ? 'active' : 'inactive')) === statusFilter);
    rows.sort((a, b) => { const dir = sortDir === 'asc' ? 1 : -1; if (sortKey === 'title') return (a.title || '').localeCompare(b.title || '') * dir; if (sortKey === 'category') return (a.category || '').localeCompare(b.category || '') * dir; if (sortKey === 'startDate') return (new Date(a.startDate || 0) - new Date(b.startDate || 0)) * dir; return 0; });
    const total = rows.length; const start = (page - 1) * pageSize; const paged = rows.slice(start, start + pageSize);
    return { rows: paged, total, all: rows };
  }, [tests, search, statusFilter, sortKey, sortDir, page]);

  const totalPages = Math.max(1, Math.ceil(derived.total / pageSize));

  const toggleSelectAll = (checked) => {
    const next = { ...selected };
    derived.rows.forEach(t => { next[t._id] = checked; });
    setSelected(next);
  };
  const toggleSelect = (id, checked) => setSelected(prev => ({ ...prev, [id]: checked }));

  const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

  const exportCsv = () => {
    const headers = ['Title', 'Category', 'Questions', 'Status', 'Start', 'End', 'Duration(min)'];
    const data = derived.all.map(t => [
      t.title || '-',
      t.category || '-',
      Array.isArray(t.questions) ? t.questions.length : (t.totalQuestions || 0),
      t.status || (t.isActive ? 'active' : 'inactive'),
      t.startDate ? new Date(t.startDate).toLocaleString() : '-',
      t.endDate ? new Date(t.endDate).toLocaleString() : '-',
      t.duration || (t.startDate && t.endDate ? Math.round((new Date(t.endDate) - new Date(t.startDate))/60000) : '-')
    ]);
    const csv = [headers, ...data].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tests.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const bulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Deactivate ${selectedIds.length} selected test(s)?`)) return;
    setLoading(true); setError(''); setSuccess('');
    try { for (const id of selectedIds) { await handleDeactivate(id); } setSuccess('Selected tests deactivated.'); fetchTests(); }
    catch { setError('Failed to deactivate some tests'); }
    finally { setLoading(false); }
  };

  const bulkActivate = async (start, end, duration) => {
    if (selectedIds.length === 0) return;
    setLoading(true); setError(''); setSuccess('');
    try { for (const id of selectedIds) { await doActivate(id, start, end, duration); } setSuccess('Selected tests activated.'); setBulkModal({ open: false, start: '', end: '', duration: '' }); fetchTests(); }
    catch (err) { setError('Failed to activate some tests'); }
    finally { setLoading(false); }
  };

  const onInlineChange = (test, field, value) => {
    const id = test._id;
    inlineDraftRef.current[id] = { ...(inlineDraftRef.current[id] || {}), [field]: value };
    // Debounce save
    if (debounceTimersRef.current[id]) clearTimeout(debounceTimersRef.current[id]);
    debounceTimersRef.current[id] = setTimeout(async () => {
      const payload = inlineDraftRef.current[id] || {};
      try { await api.put(`/tests/${id}`, payload); setSuccess('Saved'); fetchTests(); }
      catch (err) { setError(err.response?.data?.message || 'Failed to save changes'); }
      finally { clearTimeout(debounceTimersRef.current[id]); delete debounceTimersRef.current[id]; }
    }, 150);
  };

  return (
    <div>
      {/* Quick Guide */}
      <div className="mb-3">
        <button className="text-sm px-3 py-1.5 border rounded bg-gray-50 hover:bg-gray-100" onClick={() => setShowGuide(v => !v)}>
          {showGuide ? 'Hide' : 'Show'} Quick Guide
        </button>
        {showGuide && (
          <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
            <div className="font-semibold mb-1">Mentor/Admin Quick Guide</div>
            <ul className="list-disc ml-5 space-y-1">
              <li><b>Search/Filter/Sort</b>: use controls above the table to quickly find tests.</li>
              <li><b>Inline Edit</b>: edit Title, Description, Category directly in the table. Changes auto-save after 150ms.</li>
              <li><b>Add Questions</b>: use "Add" for manual or CSV bulk upload. Invalid CSV rows are reported.</li>
              <li><b>Activate</b>: click Start to set the window and duration. Only possible when questions > 0.</li>
              <li><b>Bulk Actions</b>: select rows to Activate (with one window) or Deactivate many tests at once.</li>
              <li><b>Status Badges</b>: Active/Upcoming/Expired/Draft/Inactive reflect server state.</li>
              <li><b>Export</b>: Export CSV downloads the current filtered/sorted list.</li>
              <li><b>Safety</b>: actions are disabled during requests; destructive actions confirm before proceeding.</li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h3 className="font-semibold">All Tests</h3>
        <div className="flex items-center gap-2">
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by title or category" className="border border-gray-300 rounded px-2 py-1 text-sm" aria-label="Search tests" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded px-2 py-1 text-sm" aria-label="Filter status">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={sortKey} onChange={e => setSortKey(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm" aria-label="Sort column">
            <option value="startDate">By Window</option>
            <option value="title">By Title</option>
            <option value="category">By Category</option>
          </select>
          <select value={sortDir} onChange={e => setSortDir(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm" aria-label="Sort direction">
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
          <button onClick={exportCsv} className="px-3 py-1.5 text-sm bg-gray-100 border rounded">Export CSV</button>
          <button onClick={() => setBulkModal({ open: true, start: '', end: '', duration: '' })} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded" disabled={selectedIds.length === 0 || loading}>Activate Selected</button>
          <button onClick={bulkDeactivate} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded" disabled={selectedIds.length === 0 || loading}>Deactivate Selected</button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <svg className="animate-spin h-8 w-8 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
          <span>Loading tests...</span>
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm" aria-label="All tests table">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1"><input type="checkbox" onChange={e => toggleSelectAll(e.target.checked)} checked={derived.rows.length > 0 && derived.rows.every(t => selected[t._id])} aria-label="Select all on page" /></th>
              <th className="border px-2 py-1">Title</th>
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Questions</th>
              <th className="border px-2 py-1">Window</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {derived.rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-8">No tests match your filters.</td></tr>
            ) : (
              derived.rows.map(test => {
                const questionCount = Array.isArray(test.questions) ? test.questions.length : (test.totalQuestions || 0);
                const draft = inlineDraftRef.current[test._id] || {};
                const titleVal = draft.title !== undefined ? draft.title : (test.title || '');
                const categoryVal = draft.category !== undefined ? draft.category : (test.category || '');
                const descVal = draft.description !== undefined ? draft.description : (test.description || '');
                return (
                  <tr key={test._id} tabIndex={0} aria-label={test.title}>
                    <td className="border px-2 py-1 text-center"><input type="checkbox" checked={!!selected[test._id]} onChange={e => toggleSelect(test._id, e.target.checked)} aria-label={`Select ${test.title}`} /></td>
                    <td className="border px-2 py-1">
                      <input className="w-full border px-2 py-1 rounded" value={titleVal} onChange={e => onInlineChange(test, 'title', e.target.value)} placeholder="Title" />
                      <textarea className="w-full mt-1 border px-2 py-1 rounded text-xs" rows={2} value={descVal} onChange={e => onInlineChange(test, 'description', e.target.value)} placeholder="Description" />
                    </td>
                    <td className="border px-2 py-1">
                      <select className="border px-2 py-1 rounded w-full" value={categoryVal} onChange={e => onInlineChange(test, 'category', e.target.value)}>
                        <option value="">Select</option>
                        <option value="Communication">Communication</option>
                        <option value="Quantitative">Quantitative</option>
                        <option value="Technical">Technical</option>
                        <option value="Interview">Interview</option>
                      </select>
                    </td>
                    <td className="border px-2 py-1 text-center">{questionCount}</td>
                    <td className="border px-2 py-1">{test.startDate && test.endDate ? (<span>{new Date(test.startDate).toLocaleString()} to {new Date(test.endDate).toLocaleString()}<br /><span className="text-xs text-gray-500">Duration: {test.duration ? test.duration + ' min' : Math.round((new Date(test.endDate) - new Date(test.startDate))/60000) + ' min'}</span></span>) : (<span className="text-gray-400">Not set</span>)}</td>
                    <td className="border px-2 py-1"><StatusBadge status={test.status || (test.isActive ? 'active' : 'inactive')} /></td>
                   <td className="border px-2 py-1">
  <div className="flex flex-wrap gap-1 items-center">
                        <button className="px-2 py-1 bg-yellow-500 text-white rounded text-xs" onClick={() => openQModal(test._id)} aria-label={`Add questions to ${test.title}`} disabled={loading}>Add</button>
                        <button className="px-2 py-1 bg-gray-500 text-white rounded text-xs" onClick={() => openViewQModal(test)} aria-label={`View questions for ${test.title}`} disabled={loading}>View</button>
                        <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs" onClick={() => openEditModal(test)} aria-label={`Edit settings for ${test.title}`} disabled={loading}>Settings</button>
    {test.isActive ? (
                          <button className="px-2 py-1 bg-red-600 text-white rounded text-xs" onClick={async () => { if (window.confirm(`Are you sure you want to stop the test "${test.title}"?`)) { setLoading(true); try { await handleDeactivate(test._id); setSuccess('Test deactivated!'); fetchTests(); } catch { setError('Failed to deactivate test'); } finally { setLoading(false); } } }} aria-label={`Stop test ${test.title}`} disabled={loading}>Stop</button>
                        ) : (
                          <button className={`px-2 py-1 rounded text-xs ${questionCount === 0 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-600 text-white'}`} onClick={() => setWindowModal({ open: true, testId: test._id, start: '', end: '', duration: '' })} aria-label={`Start test ${test.title}`} disabled={questionCount === 0 || loading}>Start</button>
                        )}
                        <button className="px-2 py-1 bg-gray-800 text-white rounded text-xs" onClick={() => handleDeleteTest(test._id)} aria-label={`Delete test ${test.title}`} disabled={loading}>Delete</button>
  </div>
</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
        <span>Page {page} of {totalPages} • {derived.total} total</span>
        <div className="space-x-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded disabled:opacity-50" disabled={page === 1}>Prev</button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 border rounded disabled:opacity-50" disabled={page === totalPages}>Next</button>
        </div>
      </div>

      {/* Edit Test Settings Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="font-semibold mb-4">Edit Test Settings</h3>
            <div className="mb-3"><label className="block font-medium mb-1">Require All Questions to be Attempted</label><input type="checkbox" checked={editModal.form.requireAllQuestions} onChange={e => handleEditChange('requireAllQuestions', e.target.checked)} /><span className="ml-2">ON</span></div>
            <div className="mb-3"><label className="block font-medium mb-1">Allow Navigation Between Questions</label><input type="checkbox" checked={editModal.form.allowNavigation} onChange={e => handleEditChange('allowNavigation', e.target.checked)} /><span className="ml-2">ON</span></div>
            <div className="mb-3"><label className="block font-medium mb-1">Tab Switch Limit</label><input type="number" min={1} max={10} value={editModal.form.tabSwitchLimit} onChange={e => handleEditChange('tabSwitchLimit', Number(e.target.value))} className="input w-20 ml-2" /><span className="ml-2 text-xs">(Default: 3, 4th switch auto-submits)</span></div>
            <div className="mb-3"><label className="block font-medium mb-1">Device Restriction</label><div className="flex gap-2"><label><input type="radio" name="deviceRestriction" value="mobile" checked={editModal.form.deviceRestriction === 'mobile'} onChange={e => handleEditChange('deviceRestriction', e.target.value)} /> Mobile Only</label><label><input type="radio" name="deviceRestriction" value="desktop" checked={editModal.form.deviceRestriction === 'desktop'} onChange={e => handleEditChange('deviceRestriction', e.target.value)} /> Laptop/Desktop Only</label><label><input type="radio" name="deviceRestriction" value="both" checked={editModal.form.deviceRestriction === 'both'} onChange={e => handleEditChange('deviceRestriction', e.target.value)} /> Both</label></div></div>
            <div className="mb-3"><label className="block font-medium mb-1">Allowed Branches</label><select multiple className="input w-full" value={editModal.form.allowedBranches} onChange={e => { const values = Array.from(e.target.selectedOptions, o => o.value); if (values.includes('__ALL__')) { handleEditChange('allowedBranches', ['__ALL__']); } else { handleEditChange('allowedBranches', values); } }}><option value="__ALL__">All Branches (Allow all students)</option>{branchOptions.map(branch => <option key={branch} value={branch}>{branch}</option>)}</select></div>
            <div className="mb-3"><label className="block font-medium mb-1">Allowed Years</label><select multiple className="input w-full" value={editModal.form.allowedYears} onChange={e => { const values = Array.from(e.target.selectedOptions, o => o.value); if (values.includes('__ALL__')) { handleEditChange('allowedYears', ['__ALL__']); } else { handleEditChange('allowedYears', values); } }}><option value="__ALL__">All Years (Allow all students)</option>{yearOptions.map(year => <option key={year} value={year}>{year}</option>)}</select></div>
            <div className="flex gap-2 mt-4"><button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleEditSave} disabled={loading}>Save</button><button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={closeEditModal}>Cancel</button></div>
          </div>
        </div>
      )}

      {/* Add Questions Modal */}
      {showQModal && (<AddQuestionsModal closeQModal={closeQModal} handleAddQuestions={handleAddQuestions} loading={loading} />)}

      {/* View Questions Modal */}
      {viewQModal.open && (<ViewQuestionsModal questions={viewQModal.questions} testId={viewQModal.testId} testTitle={viewQModal.testTitle} onClose={closeViewQModal} fetchQuestions={openViewQModal} />)}

      {/* Set Window Modal for Start Test */}
      {windowModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="font-semibold mb-2">Set Exam Window & Duration</h3>
            <div className="mb-4"><label className="block mb-1">Start Date & Time</label><input type="datetime-local" className="input w-full" value={windowModal.start} onChange={e => setWindowModal(w => ({ ...w, start: e.target.value }))} /></div>
            <div className="mb-4"><label className="block mb-1">End Date & Time</label><input type="datetime-local" className="input w-full" value={windowModal.end} onChange={e => setWindowModal(w => ({ ...w, end: e.target.value }))} /></div>
            <div className="mb-4"><label className="block mb-1">Duration (minutes)</label><input type="number" min="1" className="input w-full" value={windowModal.duration} onChange={e => setWindowModal(w => ({ ...w, duration: e.target.value }))} placeholder="Enter duration in minutes" /></div>
            <div className="flex space-x-2"><button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={async () => { setLoading(true); setError(''); setSuccess(''); try { await doActivate(windowModal.testId, windowModal.start, windowModal.end, windowModal.duration); setSuccess('Test activated!'); setWindowModal({ open: false, testId: null, start: '', end: '', duration: '' }); fetchTests(); } catch (err) { setError('Failed to activate test'); } finally { setLoading(false); } }} disabled={!windowModal.start || !windowModal.end || !windowModal.duration || loading}>Start Test</button><button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setWindowModal({ open: false, testId: null, start: '', end: '', duration: '' })}>Cancel</button></div>
          </div>
        </div>
      )}

      {/* Bulk Activate Modal */}
      {bulkModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="font-semibold mb-2">Activate Selected Tests</h3>
            <div className="mb-4"><label className="block mb-1">Start Date & Time</label><input type="datetime-local" className="input w-full" value={bulkModal.start} onChange={e => setBulkModal(m => ({ ...m, start: e.target.value }))} /></div>
            <div className="mb-4"><label className="block mb-1">End Date & Time</label><input type="datetime-local" className="input w-full" value={bulkModal.end} onChange={e => setBulkModal(m => ({ ...m, end: e.target.value }))} /></div>
            <div className="mb-4"><label className="block mb-1">Duration (minutes)</label><input type="number" min="1" className="input w-full" value={bulkModal.duration} onChange={e => setBulkModal(m => ({ ...m, duration: e.target.value }))} placeholder="Enter duration in minutes" /></div>
            <div className="flex space-x-2"><button className="px-4 py-2 bg-green-600 text-white rounded" onClick={async () => { await bulkActivate(bulkModal.start, bulkModal.end, bulkModal.duration); }} disabled={!bulkModal.start || !bulkModal.end || !bulkModal.duration || loading}>Activate</button><button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setBulkModal({ open: false, start: '', end: '', duration: '' })}>Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageTestsTable;
