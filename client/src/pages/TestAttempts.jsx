import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const TestAttempts = () => {
  const { id } = useParams(); // test id
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [test, setTest] = useState(null);

  useEffect(() => {
    fetchAttempts();
  }, [id]);

  const fetchAttempts = async () => {
    setLoading(true);
    try {
      // Get all attempts for this test by the current user
      const res = await api.get(`/tests/results/student?testId=${id}`);
      setAttempts(res.data.results || []);
      // Fetch test details for question text/correct answers
      const testRes = await api.get(`/tests/${id}`);
      setTest(testRes.data.test);
    } catch {
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading attempts...</div>;

  if (!attempts.length) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4">No attempts found for this test.</div>
        <Button onClick={() => navigate('/results')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Results
        </Button>
      </div>
    );
  }

  if (selectedAttempt && test) {
    // Detailed review UI
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Button onClick={() => setSelectedAttempt(null)} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Attempts
        </Button>
        <h2 className="text-2xl font-bold mb-2">Attempt Review</h2>
        <div className="mb-2 text-gray-700">Score: <span className="font-bold">{selectedAttempt.score}</span> / {selectedAttempt.totalScore} ({selectedAttempt.percentage}%)</div>
        <div className="mb-2 text-gray-700">Time Spent: {selectedAttempt.timeTaken} min</div>
        <div className="mb-4 text-xs text-gray-500">Completed: {new Date(selectedAttempt.completedAt).toLocaleString()}</div>
        <div className="space-y-6">
          {test.questions.map((q, idx) => {
            const userAns = selectedAttempt.answers.find(a => a.questionIndex === idx);
            const isCorrect = userAns?.isCorrect;
            return (
              <div key={idx} className="p-4 rounded border bg-white">
                <div className="flex items-center mb-2">
                  <span className="font-semibold text-gray-900 mr-2">Q{idx + 1}:</span>
                  <span className="text-gray-900">{q.question}</span>
                  {isCorrect === true && <CheckCircle className="w-5 h-5 text-green-600 ml-2" />}
                  {isCorrect === false && <XCircle className="w-5 h-5 text-red-600 ml-2" />}
                </div>
                <div className="ml-6 space-y-1">
                  {q.options.map((opt, oidx) => {
                    const isUser = userAns?.selectedAnswer === oidx;
                    const isRight = q.correctAnswer === oidx;
                    return (
                      <div key={oidx} className={`px-2 py-1 rounded ${isUser ? (isRight ? 'bg-green-100' : 'bg-red-100') : isRight ? 'bg-green-50' : ''} ${isUser ? 'font-bold' : ''}`}>
                        {isUser && <span className="mr-1">{isRight ? '✔️' : '❌'}</span>}
                        {opt}
                        {isRight && <span className="ml-2 text-xs text-green-700">(Correct)</span>}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && <div className="mt-2 text-xs text-blue-700">Explanation: {q.explanation}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // List of attempts
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button onClick={() => navigate('/results')} variant="outline" className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Results
      </Button>
      <h2 className="text-2xl font-bold mb-4">Your Attempts</h2>
      <div className="space-y-4">
        {attempts.map((a, idx) => (
          <div key={a._id} className="p-4 rounded border bg-white flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-gray-900">Attempt {attempts.length - idx}</div>
              <div className="text-gray-700 text-sm">Score: {a.score} / {a.totalScore} ({a.percentage}%)</div>
              <div className="text-gray-700 text-sm">Time: {a.timeTaken} min</div>
              <div className="text-xs text-gray-500">{new Date(a.completedAt).toLocaleString()}</div>
            </div>
            <Button onClick={() => setSelectedAttempt(a)} className="mt-2 md:mt-0">Review</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestAttempts;
