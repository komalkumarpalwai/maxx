import React, { useState } from 'react';
import api from '../services/api';

const ConnectionTest = () => {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);

  const testConnection = async () => {
    setStatus('testing');
    setError(null);
    setResult(null);
    setDetails(null);
    
    try {
      console.log('Testing connection to:', process.env.REACT_APP_API_URL || 'http://localhost:5001/api');
      
      const response = await api.get('/health');
      setResult(response.data);
      setStatus('success');
      setDetails({
        url: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
        status: response.status,
        headers: response.headers
      });
    } catch (err) {
      console.error('Connection test failed:', err);
      setError(err.message);
      setStatus('error');
      setDetails({
        url: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">🔧 API Connection Debug</h3>
      
      <div className="mb-4 space-y-2">
        <p className="text-sm text-gray-600">
          <strong>Environment:</strong> {process.env.NODE_ENV}
        </p>
        <p className="text-sm text-gray-600">
          <strong>API URL:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:5001/api (not set)'}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Current Host:</strong> {window.location.hostname}
        </p>
      </div>
      
      <button
        onClick={testConnection}
        disabled={status === 'testing'}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'testing' ? 'Testing...' : 'Test Connection'}
      </button>

      {status === 'success' && result && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
          <h4 className="font-semibold text-green-800">✅ Connection Successful!</h4>
          <div className="text-sm text-green-700 mt-2">
            <p><strong>Response:</strong></p>
            <pre className="bg-white p-2 rounded text-xs">{JSON.stringify(result, null, 2)}</pre>
            {details && (
              <div className="mt-2">
                <p><strong>Details:</strong></p>
                <pre className="bg-white p-2 rounded text-xs">{JSON.stringify(details, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {status === 'error' && error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
          <h4 className="font-semibold text-red-800">❌ Connection Failed</h4>
          <p className="text-sm text-red-700 mt-2"><strong>Error:</strong> {error}</p>
          {details && (
            <div className="mt-2">
              <p className="text-sm text-red-700"><strong>Details:</strong></p>
              <pre className="bg-white p-2 rounded text-xs">{JSON.stringify(details, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionTest;
