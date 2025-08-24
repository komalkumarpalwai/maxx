import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, AlertCircle, ArrowLeft, Maximize2 } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import api from '../services/api';

const TestTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // const { user } = useAuth(); // Not used
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  // Security: Tab switch/blur warnings
  const [ , setWarningCount] = useState(0); // Remove warningCount variable
  const [showFullScreenMsg, setShowFullScreenMsg] = useState(false);
  const testContainerRef = useRef(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  // const { user } = useAuth(); // Not used
  // Mobile device detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent;
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Reset warnings and state on mount (refresh)
    setWarningCount(0);
    setShowFullScreenMsg(false);
    checkAlreadyAttempted();
    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', preventContextMenu, true);
      document.removeEventListener('keydown', preventShortcuts, true);
      document.removeEventListener('copy', preventCopyPaste, true);
      document.removeEventListener('paste', preventCopyPaste, true);
      document.removeEventListener('cut', preventCopyPaste, true);
      document.removeEventListener('selectstart', preventTextSelect, true);
    };
    // eslint-disable-next-line
  }, [id]);

  const checkAlreadyAttempted = async () => {
    try {
      const res = await api.get('/tests/results/student');
      if (res.data.success) {
        const attempted = res.data.results.find(r => (r.test && (r.test._id === id || r.test === id)));
        if (attempted) {
          setAlreadyAttempted(true);
          setLoading(false);
          return;
        }
      }
      // If not attempted, fetch test as usual
      fetchTest();
    } catch {
      setLoading(false);
    }
  };

  // Timer effect, robust to function reference
  useEffect(() => {
    if (!showInstructions && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Use setTimeout to avoid React state update in unmounted component
            setTimeout(() => handleSubmitTest(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    // eslint-disable-next-line
  }, [showInstructions, timeLeft]);

  // Full screen and security event listeners
  // Security and event listeners
  useEffect(() => {
    if (!showInstructions && fullScreen) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('fullscreenchange', handleFullScreenChange);
      window.addEventListener('blur', handleWindowBlur);
      document.addEventListener('contextmenu', preventContextMenu, true);
      document.addEventListener('keydown', preventShortcuts, true);
      document.addEventListener('copy', preventCopyPaste, true);
      document.addEventListener('paste', preventCopyPaste, true);
      document.addEventListener('cut', preventCopyPaste, true);
      document.addEventListener('selectstart', preventTextSelect, true);
    }
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', preventContextMenu, true);
      document.removeEventListener('keydown', preventShortcuts, true);
      document.removeEventListener('copy', preventCopyPaste, true);
      document.removeEventListener('paste', preventCopyPaste, true);
      document.removeEventListener('cut', preventCopyPaste, true);
      document.removeEventListener('selectstart', preventTextSelect, true);
    };
    // eslint-disable-next-line
  }, [showInstructions, fullScreen]);
  const fetchTest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tests/${id}`);
      const data = response.data;
      if (data.success) {
        setTest(data.test);
        setTimeLeft(data.test.duration * 60); // Convert to seconds
        // Initialize answers object
        const initialAnswers = {};
        data.test.questions.forEach((_, index) => {
          initialAnswers[index] = { selectedAnswer: null };
        });
        setAnswers(initialAnswers);
      } else {
        toast.error(data.message || 'Failed to fetch test');
        navigate('/tests');
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      toast.error('Failed to fetch test');
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  // Security: Prevent right-click, copy, print, dev tools
  // --- Security: Prevent context menu, shortcuts, copy/paste, selection ---
  function preventContextMenu(e) {
    e.preventDefault();
    return false;
  }
  function preventShortcuts(e) {
    // F12, Ctrl+Shift+I/J/C/U, Ctrl+U, Ctrl+P (print), Ctrl+C (copy), Ctrl+V (paste), Ctrl+X (cut)
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
      (e.ctrlKey && ['u', 'U', 'p', 'P', 'c', 'C', 'v', 'V', 'x', 'X'].includes(e.key))
    ) {
      e.preventDefault();
      return false;
    }
  }
  function preventCopyPaste(e) {
    e.preventDefault();
    return false;
  }
  function preventTextSelect(e) {
    e.preventDefault();
    return false;
  }
  // --- Tab switch/blur/fullscreenchange: warning counter and auto-submit ---
  const isSubmittingRef = useRef(false);
  useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);
  const autoSubmit = (reason) => {
    if (!isSubmittingRef.current) {
      toast.error(reason);
      handleSubmitTest();
    }
  };
  // Show warning and auto-submit on 3rd violation
  const handleViolation = (type) => {
    setWarningCount(prev => {
      const next = prev + 1;
      if (next === 1) {
        toast.error('Warning 1/3: Do not switch tabs!');
      } else if (next === 2) {
        toast.error('Warning 2/3: Last chance!');
      } else if (next >= 3) {
        toast.error('Warning 3/3: Exam will be auto-submitted!');
        setTimeout(() => autoSubmit('Maximum tab switches/violations reached.'), 500);
      }
      return next;
    });
  };
  function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      handleViolation('tab');
    }
  }
  function handleWindowBlur() {
    handleViolation('blur');
  }
  function handleFullScreenChange() {
    const isFs = !!document.fullscreenElement;
    setFullScreen(isFs);
    if (!isFs && !showInstructions) {
      setShowFullScreenMsg(true);
    } else {
      setShowFullScreenMsg(false);
    }
  }
  // Enter full screen
  const enterFullScreen = () => {
    if (testContainerRef.current && testContainerRef.current.requestFullscreen) {
      testContainerRef.current.requestFullscreen().then(() => setFullScreen(true)).catch(() => setFullScreen(true));
    } else {
      setFullScreen(true); // fallback
    }
    setShowFullScreenMsg(false);
  };
  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: { selectedAnswer: answerIndex }
    }));
  };

  // Navigation (disabled if not fullscreen)
  const goToNext = () => {
    if (!fullScreen) return;
    setCurrentQuestion((prev) => Math.min(prev + 1, test.questions.length - 1));
  };
  const goToPrev = () => {
    if (!fullScreen) return;
    setCurrentQuestion((prev) => Math.max(prev - 1, 0));
  };
  const goToQuestion = (idx) => {
    if (!fullScreen) return;
    setCurrentQuestion(idx);
  };
  const handleSubmitTest = async () => {
    if (isSubmittingRef.current) return;
    // Validate answers structure
    const answersArray = Object.values(answers).map((a, idx) => ({
      selectedAnswer: typeof a.selectedAnswer === 'number' ? a.selectedAnswer : null
    }));
    const unansweredQuestions = answersArray.filter(
      answer => answer.selectedAnswer === null
    );
    if (unansweredQuestions.length > 0) {
      const shouldSubmit = window.confirm(
        `You have ${unansweredQuestions.length} unanswered questions. Are you sure you want to submit?`
      );
      if (!shouldSubmit) {
        // Reset isSubmittingRef so auto-submit can trigger again
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const timeTaken = (test.duration * 60) - timeLeft; // Time taken in seconds
      const response = await api.post(`/tests/${id}/submit`, {
        answers: answersArray,
        timeTaken: Math.floor(timeTaken / 60) // Convert to minutes
      });
      const data = response.data;
      if (data.success) {
        toast.success('Test submitted successfully!');
        // Exit full screen if possible and only if in fullscreen
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen();
        }
        navigate('/tests');
      } else {
        toast.error((data.message ? data.message : 'Failed to submit test') + (data.error ? `: ${data.error}` : ''));
        // Reset isSubmittingRef so auto-submit can trigger again
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      let msg = 'Failed to submit test';
      if (error.response && error.response.data && error.response.data.message) {
        msg = error.response.data.message;
        if (error.response.data.error) {
          msg += `: ${error.response.data.error}`;
        }
      }
      toast.error(msg);
      // Reset isSubmittingRef so auto-submit can trigger again
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    } finally {
      // Only set submitting false here if not already reset above
      if (isSubmittingRef.current) {
        setIsSubmitting(false);
        isSubmittingRef.current = false;
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };


  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <AlertCircle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Not Available on Mobile</h2>
        <p className="text-gray-700 text-center mb-4 max-w-md">For security and best experience, tests can only be taken from a desktop or laptop device. Please access this page from a supported device.</p>
        <Button onClick={() => navigate('/tests')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tests
        </Button>
      </div>
    );
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (alreadyAttempted) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-2 text-lg font-bold text-gray-900">You have already completed this test.</h3>
        <Button onClick={() => navigate('/results')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go to Results
        </Button>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Test not found</h3>
        <Button onClick={() => navigate('/tests')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tests
        </Button>
      </div>
    );
  }

  // Show instructions and agreement before starting
  if (showInstructions) {
    return (
      <div className="max-w-2xl mx-auto card mt-10 bg-white">
        <h1 className="text-2xl font-bold mb-4">Test Instructions</h1>
        <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
          <li>Do not switch tabs or leave full screen. Doing so will auto-submit your test.</li>
          <li>Do not use right-click, copy, print, or developer tools during the test.</li>
          <li>Read each question carefully and answer to the best of your ability.</li>
          <li>Once you start, the timer will begin and cannot be paused.</li>
          <li>Click "Start Test" to enter full screen and begin.</li>
        </ul>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="agree" className="text-gray-800">I have read and agree to the instructions above.</label>
        </div>
        <Button
          onClick={() => {
            setShowInstructions(false);
            setTimeout(() => enterFullScreen(), 100); // Enter full screen after render
          }}
          disabled={!agreed}
          size="lg"
          className="w-full"
        >
          <Maximize2 className="w-5 h-5 mr-2" />
          Start Test
        </Button>
      </div>
    );
  }

  // Main test UI
  return (
    <div
      className="max-w-4xl mx-auto bg-white min-h-screen select-none"
      ref={testContainerRef}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        pointerEvents: showFullScreenMsg ? 'none' : 'auto',
        filter: showFullScreenMsg ? 'blur(2px)' : 'none',
      }}
      onContextMenu={preventContextMenu}
      onCopy={preventCopyPaste}
      onPaste={preventCopyPaste}
      onCut={preventCopyPaste}
      onSelectStart={preventTextSelect}
    >
      {/* Header */}
      <div className="mb-6">
        <Button 
          onClick={() => {
            if (window.confirm('Are you sure you want to leave? Your test will be submitted.')) {
              handleSubmitTest();
            }
          }} 
          variant="outline" 
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Exit & Submit
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
            <p className="text-gray-600 mt-2">{test.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Time Remaining</div>
            <div className={`text-2xl font-bold ${
              timeLeft < 300 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Object.values(answers).filter(a => a.selectedAnswer !== null).length} / {test.questions.length} answered</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(Object.values(answers).filter(a => a.selectedAnswer !== null).length / test.questions.length) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {test.questions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToQuestion(idx)}
            className={`w-8 h-8 rounded-full border text-sm font-bold focus:outline-none transition-colors duration-200
              ${currentQuestion === idx ? 'bg-blue-600 text-white border-blue-600' : answers[idx]?.selectedAnswer !== null ? 'bg-green-100 border-green-400 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-700'}
              ${!fullScreen ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={`Go to question ${idx + 1}`}
            disabled={!fullScreen}
            tabIndex={!fullScreen ? -1 : 0}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Single Question View */}
      <div className="card mb-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">
              Question {currentQuestion + 1} of {test.questions.length}
            </span>
            <span className="text-sm text-gray-500">
              {test.questions[currentQuestion].points} point{test.questions[currentQuestion].points !== 1 ? 's' : ''}
            </span>
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            {test.questions[currentQuestion].question}
          </h3>
        </div>
        <div className="space-y-3">
          {test.questions[currentQuestion].options.map((option, optionIndex) => (
            <label
              key={optionIndex}
              className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors duration-200 ${
                answers[currentQuestion]?.selectedAnswer === optionIndex
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion}`}
                value={optionIndex}
                checked={answers[currentQuestion]?.selectedAnswer === optionIndex}
                onChange={() => handleAnswerSelect(currentQuestion, optionIndex)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                answers[currentQuestion]?.selectedAnswer === optionIndex
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {answers[currentQuestion]?.selectedAnswer === optionIndex && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <span className="text-gray-900">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mb-8">
        <Button onClick={goToPrev} disabled={currentQuestion === 0 || !fullScreen} variant="secondary">
          Previous
        </Button>
        <Button onClick={goToNext} disabled={currentQuestion === test.questions.length - 1 || !fullScreen} variant="secondary">
          Next
        </Button>
      </div>

      {/* Submit Button */}
      <div className="mt-8 text-center">
        <Button
          onClick={handleSubmitTest}
          loading={isSubmitting}
          disabled={isSubmitting || !fullScreen}
          size="lg"
          className="px-8"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Submit Test
        </Button>
        <p className="text-sm text-gray-500 mt-2">
          Make sure to review all your answers before submitting
        </p>
      </div>

      {/* Fullscreen required message overlay */}
      {showFullScreenMsg && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Please switch to full screen to continue your exam.</h2>
            <p className="mb-4 text-gray-700">You must remain in full screen mode for the duration of the test. Navigation and answering are disabled until you return to full screen.</p>
            <Button onClick={enterFullScreen} size="lg" className="w-full">Re-enter Full Screen</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestTaking;
