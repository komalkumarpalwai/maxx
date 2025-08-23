
import React, { useState } from 'react';
import api from '../services/api';

const CreateTestForm = () => {
  const [tab, setTab] = useState('Communication');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/tests', {
        title,
        category: tab,
        description,
        instructions
      });
      setSuccess('Test created successfully!');
      setTitle(''); setDescription(''); setInstructions('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex space-x-2 mb-4">
        {['Communication', 'Quantitative'].map(cat => (
          <button key={cat} className={`px-4 py-2 rounded ${tab === cat ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setTab(cat)}>{cat} Round</button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input" placeholder="Test Title" value={title} onChange={e => setTitle(e.target.value)} required />
          <input className="input" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div>
          <textarea
            className="input w-full mt-2"
            placeholder="Test Instructions (optional, shown before test starts)"
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={4}
          />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Creating...' : 'Create Test'}</button>
      </form>
    </div>
  );
};

export default CreateTestForm;
