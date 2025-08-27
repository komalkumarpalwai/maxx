import React, { useState } from 'react';
import api from '../services/api';

const FeedbackPopup = ({ user, onClose }) => {
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!message.trim()) {
      setError('Please enter your feedback.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/feedback', { message });
      if (res.data.success) {
        setSuccess('Thank you for your feedback!');
        setMessage('');
        setTimeout(onClose, 1500);
      } else {
        setError(res.data.message || 'Failed to submit feedback.');
      }
    } catch {
      setError('Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl" onClick={onClose} aria-label="Close">&times;</button>
        <h3 className="text-lg font-bold mb-4">We value your feedback!</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            className="input w-full mb-3 border rounded p-2"
            rows={5}
            placeholder="Share your thoughts, suggestions, or issues..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            aria-label="Feedback message"
            required
          />
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Submitting...' : 'Submit Feedback'}</button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPopup;
