import React from 'react';

const TestProgress = ({ 
  currentQuestion, 
  totalQuestions, 
  answeredCount, 
  visitedCount, 
  markedCount,
  timeLeft,
  duration 
}) => {
  const progressPercentage = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0;
  const totalSeconds = duration ? duration * 60 : 0;
  const secondsLeft = typeof timeLeft === 'number' ? timeLeft : totalSeconds;
  const timePercentage = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const isLowTime = secondsLeft <= 120; // 2 minutes

  const mm = Math.floor(secondsLeft / 60);
  const ss = (secondsLeft % 60).toString().padStart(2, '0');

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-6">
            {/* Question Progress */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Progress:</span>
              <span className="text-sm text-gray-600">
                {currentQuestion + 1} of {totalQuestions}
              </span>
            </div>
            
            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                {answeredCount} answered
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                {visitedCount} visited
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                {markedCount} marked
              </span>
            </div>
          </div>
          
          {/* Timer */}
          <div className={`px-3 py-1 rounded-lg font-mono text-sm font-bold ${
            isLowTime ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {mm}:{ss}
          </div>
        </div>
        
        {/* Progress Bars */}
        <div className="flex space-x-4">
          {/* Question Progress Bar */}
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Questions</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Time Progress Bar */}
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Time</span>
              <span>{Math.round(timePercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isLowTime ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${timePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestProgress;
