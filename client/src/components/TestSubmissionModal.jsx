import React from 'react';
import Button from './Button';

const TestSubmissionModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  answeredCount, 
  totalQuestions, 
  markedCount,
  timeLeft,
  isSubmitting 
}) => {
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="text-yellow-500 text-2xl mr-3">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900">Submit Test</h2>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Are you sure you want to submit your test? This action cannot be undone.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Questions answered:</span>
                <span className="font-semibold">{answeredCount} / {totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Questions marked for review:</span>
                <span className="font-semibold">{markedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time remaining:</span>
                <span className="font-semibold">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
              {unansweredCount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Unanswered questions:</span>
                  <span className="font-semibold">{unansweredCount}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              variant="primary"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSubmissionModal;
