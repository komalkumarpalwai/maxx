import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import toast from "react-hot-toast";
import api from "../services/api";

// Constants for better maintainability
const VIOLATION_LIMIT = 3; // Changed from 2 to 3 as requested
const LOW_TIME_WARNING = 120; // 2 minutes warning
const WARNING_TOAST_ID = 'low-time-warning'; // Prevent duplicate warnings

/**
 * Generate a unique key for each question to ensure consistent identification
 */
function getQuestionKey(q, idx) {
  return q?._id ? String(q._id) : `q-${idx}`;
}

/**
 * Determine if a question is single-choice (radio) or multiple-choice (checkbox)
 */


/**
 * Format seconds into MM:SS display format
 */
function formatTime(sec) {
  if (typeof sec !== "number" || sec < 0) return "--:--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TestTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Core test state
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Test attempt state
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [attemptCheckLoading, setAttemptCheckLoading] = useState(false);
  
  // Test progress state
  const [answers, setAnswers] = useState({});
  const [visited, setVisited] = useState(new Set());
  const [markForReview, setMarkForReview] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Timer state
  const [durationMinutes, setDurationMinutes] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  
  // Test session state
  const [testStarted, setTestStarted] = useState(false);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [agreeInstructions, setAgreeInstructions] = useState(false);
  
  // Violation tracking
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Refs for preventing race conditions
  const isSubmittingRef = useRef(false);
  const warnedRef = useRef(false);
  const answersRef = useRef(answers);
  const durationRef = useRef(durationMinutes);
  
  // Local storage key for persistence
  const localStorageKey = `testState-${id}`;

  // Keep refs in sync with state
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  
  useEffect(() => {
    durationRef.current = durationMinutes;
  }, [durationMinutes]);

  /**
   * Restore test state from localStorage on component mount
   */
  useEffect(() => {
    const raw = localStorage.getItem(localStorageKey);
    if (!raw) return;
    
    try {
      const parsed = JSON.parse(raw);
      setAnswers(parsed.answers || {});
      setCurrentQuestionIndex(
        Number.isInteger(parsed.currentQuestionIndex)
          ? parsed.currentQuestionIndex
          : 0
      );
      setVisited(
        Array.isArray(parsed.visited) ? new Set(parsed.visited) : new Set()
      );
      setMarkForReview(parsed.markForReview || {});
      setTimeLeft(
        typeof parsed.timeLeft === "number" ? parsed.timeLeft : null
      );
      setTestStarted(false);
      setResumeAvailable(
        parsed.testStarted ||
          Object.keys(parsed.answers || {}).length > 0 ||
          parsed.timeLeft !== null
      );
    } catch (error) {
      console.error('Failed to restore test state:', error);
    }
  }, [id, localStorageKey]);

  /**
   * Fetch test data and check if already attempted
   */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setAttemptCheckLoading(true);
      setError("");
      try {
        console.log('[TestTaking] Checking if test already attempted...');
        const res = await api.get("/tests/results/student");
        console.log('[TestTaking] /tests/results/student response:', res);
        if (res?.data?.results) {
          const attempted = res.data.results.some(
            (r) => r.test && (r.test._id === id || r.test === id)
          );
          if (attempted) setAlreadyAttempted(true);
        }

        console.log('[TestTaking] Fetching test details...');
        const { data } = await api.get(`/tests/${id}`);
        console.log('[TestTaking] /tests/:id response:', data);
        if (cancelled) return;

        const testObj = data.test || data;
        if (
          !testObj ||
          !Array.isArray(testObj.questions) ||
          testObj.questions.length === 0
        ) {
          setError("Test not found or has no questions.");
          setTest(null);
        } else {
          setTest(testObj);
          const dur =
            Number(testObj?.duration) ||
            Number(testObj?.durationMinutes) ||
            null;
          setDurationMinutes(dur);
          durationRef.current = dur;
          if (timeLeft === null && dur !== null) setTimeLeft(dur * 60);
        }
      } catch (err) {
        console.error('[TestTaking] Failed to load test:', err);
        setError("Failed to load test.");
        setTest(null);
      } finally {
        if (!cancelled) {
          console.log('[TestTaking] Setting loading to false');
          setLoading(false);
          setAttemptCheckLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /**
   * Persist test state to localStorage whenever it changes
   */
  useEffect(() => {
    const state = {
      answers,
      currentQuestionIndex,
      visited: Array.from(visited),
      markForReview,
      timeLeft,
      testStarted,
    };
    
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save test state:', error);
    }
  }, [
    answers,
    currentQuestionIndex,
    visited,
    markForReview,
    timeLeft,
    testStarted,
    localStorageKey,
  ]);

  /**
   * Handle page unload to save progress
   */
  useEffect(() => {
    const handler = (e) => {
      if (!testStarted) return;
      
      try {
        localStorage.setItem(
          localStorageKey,
          JSON.stringify({
            answers,
            currentQuestionIndex,
            visited: Array.from(visited),
            markForReview,
            timeLeft,
            testStarted,
          })
        );
      } catch (error) {
        console.error('Failed to save on unload:', error);
      }
      
      e.preventDefault();
      e.returnValue =
        "Your test is in progress. If you close this tab you may lose data.";
    };
    
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [
    testStarted,
    answers,
    currentQuestionIndex,
    visited,
    markForReview,
    timeLeft,
    localStorageKey,
  ]);

  /**
   * Main timer logic with auto-submission
   */
  useEffect(() => {
    if (!testStarted || timeLeft === null) return;
    
    if (timeLeft <= 0) {
      if (isSubmittingRef.current) return;
      
      (async () => {
        isSubmittingRef.current = true;
        
        try {
          const totalSeconds = (durationRef.current || durationMinutes || 0) * 60;
          const usedSeconds = Math.max(
            0,
            totalSeconds - (typeof timeLeft === "number" ? timeLeft : 0)
          );
          const timeTaken = Math.ceil(usedSeconds / 60);
          
          await api.post(`/tests/${id}/submit`, {
            answers: answersRef.current,
            timeTaken,
          });
          
          localStorage.removeItem(localStorageKey);
          toast.success("⏰ Test auto-submitted (time up)");
          navigate("/tests");
        } catch (error) {
          console.error('Auto submission failed:', error);
          toast.error("Auto submission failed");
        }
      })();
      
      return;
    }
    
    const timerId = setInterval(
      () =>
        setTimeLeft((prev) =>
          typeof prev === "number" ? Math.max(0, prev - 1) : prev
        ),
      1000
    );
    
    return () => clearInterval(timerId);
  }, [testStarted, timeLeft, id, durationMinutes, navigate, localStorageKey]);

  /**
   * Show 2-minute warning toast
   */
  useEffect(() => {
    if (timeLeft !== null && timeLeft <= LOW_TIME_WARNING && testStarted && !warnedRef.current) {
      toast.error("⚠️ Only 2 minutes left! Please submit soon.", {
        id: WARNING_TOAST_ID,
        duration: 5000,
      });
      warnedRef.current = true;
    }
  }, [timeLeft, testStarted]);

  /**
   * Mark current question as visited
   */
  useEffect(() => {
    if (!test?.questions?.[currentQuestionIndex]) return;
    
    const key = getQuestionKey(test.questions[currentQuestionIndex], currentQuestionIndex);
    setVisited(prev => prev.has(key) ? prev : new Set(prev).add(key));
  }, [currentQuestionIndex, test]);

  /**
   * Fullscreen & tab switch detection for violation tracking
   */
  useEffect(() => {
    if (!testStarted) return;
    
    const isDocFullscreen = () => !!(
      document.fullscreenElement || 
      document.webkitFullscreenElement || 
      document.mozFullScreenElement || 
      document.msFullscreenElement
    );
    
    const handleVisibility = () => {
      if (document.hidden) {
        setViolations(v => v + 1);
        toast.error(`⚠️ Tab switch detected! Violation ${Math.min(violations + 1, VIOLATION_LIMIT)}/${VIOLATION_LIMIT}`);
      }
    };
    
    const handleFullscreen = () => {
      const wasFullscreen = isFullscreen;
      const nowFullscreen = isDocFullscreen();
      
      setIsFullscreen(nowFullscreen);
      
      // Only count violation if exiting fullscreen
      if (wasFullscreen && !nowFullscreen) {
        setViolations(v => v + 1);
        toast.error(`⚠️ Fullscreen exit detected! Violation ${Math.min(violations + 1, VIOLATION_LIMIT)}/${VIOLATION_LIMIT}`);
      }
    };
    
    // Add event listeners for all browser variants
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.addEventListener("webkitfullscreenchange", handleFullscreen);
    document.addEventListener("mozfullscreenchange", handleFullscreen);
    document.addEventListener("MSFullscreenChange", handleFullscreen);
    
    // Set initial fullscreen state
    setIsFullscreen(isDocFullscreen());
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("webkitfullscreenchange", handleFullscreen);
      document.removeEventListener("mozfullscreenchange", handleFullscreen);
      document.removeEventListener("MSFullscreenChange", handleFullscreen);
    };
  }, [testStarted, isFullscreen, violations]);

  /**
   * Auto-submit test after 3 violations
   */
  useEffect(() => {
    if (violations >= VIOLATION_LIMIT && testStarted && !isSubmittingRef.current) {
      isSubmittingRef.current = true;
      
      // Show violation message before submission
      toast.error("❌ Test ended due to rule violations (3 strikes)", {
        duration: 3000,
      });
      
      (async () => {
        try {
          const totalSeconds = (durationRef.current || durationMinutes || 0) * 60;
          const usedSeconds = Math.max(
            0, 
            totalSeconds - (typeof timeLeft === "number" ? timeLeft : 0)
          );
          const timeTaken = Math.ceil(usedSeconds / 60);
          
          await api.post(`/tests/${id}/submit`, { 
            answers: answersRef.current, 
            timeTaken, 
            forced: true, 
            autoSubmitReason: "violation" 
          });
          
          localStorage.removeItem(localStorageKey);
          toast.error("Test auto-submitted due to rule violations");
          navigate("/tests");
        } catch (error) {
          console.error('Violation auto-submission failed:', error);
          toast.error("Auto submission failed");
        }
      })();
    }
  }, [violations, testStarted, id, durationMinutes, timeLeft, navigate, localStorageKey]);

  /**
   * Redirect if test already attempted
   */
  useEffect(() => {
    if (alreadyAttempted && !attemptCheckLoading) {
      toast.error("You have already attempted this test.");
      navigate("/tests");
    }
  }, [alreadyAttempted, attemptCheckLoading, navigate]);

  /**
   * Start new test session
   */
  const handleStartTest = useCallback(async () => {
    if (!durationMinutes) {
      toast.error("Test duration not available.");
      return;
    }
    
    if (!agreeInstructions) {
      toast.error("Please agree to the instructions.");
      return;
    }
    
    try {
      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen request failed:', error);
    }
    
    // Reset test state
    setAnswers({});
    setVisited(new Set());
    setMarkForReview({});
    setCurrentQuestionIndex(0);
    setTimeLeft(durationMinutes * 60);
    setTestStarted(true);
    setResumeAvailable(false);
    setViolations(0);
    warnedRef.current = false;
  }, [durationMinutes, agreeInstructions]);

  /**
   * Resume existing test session
   */
  const handleResumeTest = useCallback(async () => {
    try {
      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen request failed:', error);
    }

    // Only set timeLeft if not already set (should resume from saved value)
    if (timeLeft === null && durationMinutes) {
      setTimeLeft(durationMinutes * 60);
    }

    setTestStarted(true);
    setResumeAvailable(false);
    warnedRef.current = false;
  }, [timeLeft, durationMinutes]);

  /**
   * Handle answer selection with proper single/multiple choice logic
   */
  const handleAnswer = useCallback((questionIndex, option) => {
  if (!test?.questions?.[questionIndex]) return;
  const q = test.questions[questionIndex];
  const key = getQuestionKey(q, questionIndex);
  setAnswers(prev => ({ ...prev, [key]: option }));
  // Mark as visited
  setVisited(prev => prev.has(key) ? prev : new Set(prev).add(key));
  }, [test]);

  /**
   * Mark question for review and advance to next
   */
  const handleMarkForReview = useCallback(() => {
    if (!test?.questions?.[currentQuestionIndex]) return;
    
    const q = test.questions[currentQuestionIndex];
    const key = getQuestionKey(q, currentQuestionIndex);
    
    setMarkForReview(prev => ({ ...prev, [key]: !prev[key] }));
    
    // Auto-advance to next question if not at the end
    if (currentQuestionIndex < (test.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(i => i + 1);
    }
  }, [currentQuestionIndex, test]);

  /**
   * Clear response for current question
   */
  const handleClearResponse = useCallback(() => {
    if (!test?.questions?.[currentQuestionIndex]) return;
    
    const q = test.questions[currentQuestionIndex];
    const key = getQuestionKey(q, currentQuestionIndex);
    
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    
    setMarkForReview(prev => ({ ...prev, [key]: false }));
  }, [currentQuestionIndex, test]);

  /**
   * Navigate to specific question
   */
  const handleGoToQuestion = useCallback((index) => {
    if (index < 0 || index >= (test.questions?.length || 0)) return;
    setCurrentQuestionIndex(index);
  }, [test]);

  /**
   * Submit test with validation and confirmation
   */
  const handleSubmitTest = useCallback(async () => {
    if (isSubmittingRef.current) return;
    

    // Check for unanswered questions
    const unanswered = test.questions.filter((q, idx) => {
      const key = getQuestionKey(q, idx);
      return !answers[key];
    });

    if (unanswered.length > 0) {
      toast.error(
        `Please answer all questions before submitting. (${unanswered.length} unanswered)`,
        { duration: 4000 }
      );
      return;
    }
    

    // Confirm submission
    const ok = window.confirm(
      "Are you sure you want to submit the test? This action cannot be undone."
    );
    if (!ok) return;
    
    isSubmittingRef.current = true;
    
    try {
      const totalSeconds = (durationRef.current || durationMinutes || 0) * 60;
      const usedSeconds = Math.max(
        0, 
        totalSeconds - (typeof timeLeft === "number" ? timeLeft : 0)
      );
      const timeTaken = Math.ceil(usedSeconds / 60);

      // Transform answers to backend format: array of { selectedAnswer }
      const payloadAnswers = test.questions.map((q, idx) => {
        const key = getQuestionKey(q, idx);
        return { selectedAnswer: answersRef.current[key] || null };
      });

      await api.post(`/tests/${id}/submit`, { 
        answers: payloadAnswers, 
        timeTaken 
      });

      localStorage.removeItem(localStorageKey);
      toast.success("✅ Test submitted successfully!");
      navigate("/tests");
    } catch (err) {
      console.error('Test submission failed:', err);
      const errorMessage = err.response?.data?.message || err.message || "Submission failed. Please try again.";
      toast.error(errorMessage);
      isSubmittingRef.current = false;
    }
  }, [test, answers, timeLeft, durationMinutes, id, navigate, localStorageKey]);

  /**
   * Get CSS classes for question palette based on status
   */
  const getPaletteClass = useCallback((q, idx) => {
    const key = getQuestionKey(q, idx);
    
    if (currentQuestionIndex === idx) {
      return "bg-blue-600 text-white ring-2 ring-blue-400";
    }
    if (markForReview[key]) {
      return "bg-purple-500 text-white";
    }
    if (answers[key]) {
      return "bg-green-500 text-white";
    }
    if (visited.has(key)) {
      return "bg-red-500 text-white";
    }
    return "bg-gray-300 text-gray-700";
  }, [currentQuestionIndex, markForReview, answers, visited]);

  // Calculate progress statistics
  const answeredCount = Object.values(answers).filter(a => !!a).length;
  
  const totalQuestions = test?.questions?.length || 0;
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Resume summary component
  const resumeSummary = resumeAvailable ? (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="text-sm text-blue-800">
        <div className="font-semibold mb-2">📚 Saved progress found for this test</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Answered:</span> 
            <span className="ml-2 font-bold text-green-600">{answeredCount}</span> / {totalQuestions}
          </div>
          <div>
            <span className="font-medium">Time left:</span> 
            <span className="ml-2 font-bold text-blue-600">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  ) : null;

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => navigate("/tests")} 
              variant="primary"
              aria-label="Return to tests page"
            >
              Back to Tests
            </Button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test not found
  if (!test) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600">Test not found</p>
      </div>
    );
  }

  // Attempt check loading
  if (attemptCheckLoading) {
    console.log('[TestTaking] Render: attemptCheckLoading is', attemptCheckLoading);
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking test status...</p>
        </div>
      </div>
    );
  }

  // Already attempted
  if (alreadyAttempted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 border border-gray-200 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            🚫 Test Already Attempted
          </h1>
          <p className="text-gray-700 mb-6">
            You cannot retake this test. If you believe this is a mistake, 
            please contact your instructor or admin.
          </p>
          <Button 
            onClick={() => navigate("/tests")} 
            variant="primary"
            aria-label="Return to tests page"
          >
            Back to Tests
          </Button>
        </div>
      </div>
    );
  }

  // Test instructions and start screen
  if (!testStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          {/* Test header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-semibold text-gray-500 uppercase tracking-wide">
              Test
            </span>
            <span className="text-sm text-gray-400">
              Duration: <span className="font-semibold text-gray-700">{durationMinutes} min</span>
            </span>
          </div>
          
          {/* Test title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-left">
            {test.title}
          </h1>
          
          {/* Instructions */}
          <div className="mb-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded p-4 text-gray-900">
              <h2 className="font-semibold text-xl text-yellow-800 mb-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                Test Instructions
              </h2>
              <div className="whitespace-pre-line text-base">
                {test.instructions && test.instructions.trim().length > 0 
                  ? test.instructions 
                  : "Please read all questions carefully. Do not refresh or close the browser during the test. Your answers will be auto-submitted when time is up."
                }
              </div>
            </div>
          </div>
          
          {/* Resume summary */}
          {resumeSummary}
          
          {/* Action buttons */}
          {!resumeAvailable ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <input 
                  type="checkbox" 
                  id="agreeInstructions" 
                  checked={!!agreeInstructions} 
                  onChange={e => setAgreeInstructions(e.target.checked)} 
                  className="mr-2" 
                  aria-label="Agree to test instructions"
                />
                <label htmlFor="agreeInstructions" className="text-gray-800 select-none cursor-pointer">
                  I have read and agree to the instructions above.
                </label>
              </div>
              <Button 
                onClick={handleStartTest} 
                disabled={!agreeInstructions || !durationMinutes} 
                size="lg" 
                className="w-full"
                aria-label="Start test"
              >
                Start Test
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleResumeTest} 
                size="lg" 
                className="w-full"
                aria-label="Resume test"
              >
                Resume Test
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Test in progress - main interface
  const currentQ = test.questions?.[currentQuestionIndex] || null;
  const currentKey = currentQ ? getQuestionKey(currentQ, currentQuestionIndex) : null;

  return (
    <div className="max-w-6xl mx-auto p-2 md:p-4 lg:p-6" aria-label="Test Taking Page">
      {/* Reload warning and button */}
      <div className="mb-4 p-2 bg-yellow-50 border border-yellow-400 text-yellow-800 rounded text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <span>
          <b>Note:</b> Please use the <b>Reload</b> button below to refresh this page. Do <b>not</b> use your browser or device reload button, or you may lose your session or data.
        </span>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded"
        >
          Reload
        </button>
      </div>
      <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4 md:gap-6">
        {/* Main test area */}
        <div className="lg:col-span-3 space-y-4 w-full">
          {/* Header with title and timer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <span className="text-lg font-bold text-green-700 bg-green-100 px-3 py-1 rounded">
              {test.title}
            </span>
            <span className="text-lg font-mono text-blue-700 bg-blue-100 px-3 py-1 rounded">
              {formatTime(timeLeft)}
            </span>
          </div>
          
          {/* Question counter */}
          <div className="mb-2 text-gray-600 text-sm">
            Question {currentQuestionIndex + 1} of {test.questions.length}
          </div>
          
          {/* Question text */}
          <div className="text-lg font-medium mb-4">
            {currentQ ? (currentQ.question || currentQ.text || currentQ.questionText) : "Question not available"}
          </div>
          
          {/* Answer options */}
          <div className="space-y-3">
            {currentQ && currentQ.options && currentQ.options.map((opt, i) => {
              const key = getQuestionKey(currentQ, currentQuestionIndex);
              const selected = answers[key] === opt;
              return (
                <label 
                  key={i} 
                  className={`flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${selected ? 'bg-blue-50 border-blue-400' : ''}`}
                  aria-label={`Select option ${i + 1}${selected ? ' (selected)' : ''}`}
                  tabIndex={0}
                  htmlFor={`option-${currentQuestionIndex}-${i}`}
                >
                  <input
                    id={`option-${currentQuestionIndex}-${i}`}
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value={opt}
                    checked={selected}
                    onChange={() => handleAnswer(currentQuestionIndex, opt)}
                    className="mt-1 focus:ring-2 focus:ring-blue-400"
                    aria-checked={selected}
                    aria-label={`Radio option ${i + 1}${selected ? ' (selected)' : ''}`}
                  />
                  <span className="text-base leading-relaxed">{opt}</span>
                </label>
              );
            })}
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Button 
              onClick={handleMarkForReview} 
              variant={markForReview[currentKey] ? "primary" : "secondary"}
              aria-label={markForReview[currentKey] ? "Unmark for review" : "Mark for review and next"}
            >
              {markForReview[currentKey] ? "Unmark Review" : "Mark for Review & Next"}
            </Button>
            
            <Button 
              onClick={handleClearResponse} 
              variant="secondary" 
              aria-label="Clear response for current question"
            >
              Clear Response
            </Button>
            
            <Button 
              disabled={currentQuestionIndex === 0} 
              onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))} 
              variant="secondary" 
              aria-label="Go to previous question"
            >
              Previous
            </Button>
            
            {currentQuestionIndex < test.questions.length - 1 ? (
              <Button 
                onClick={() => setCurrentQuestionIndex(i => Math.min(test.questions.length - 1, i + 1))} 
                variant="secondary" 
                aria-label="Go to next question"
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmitTest} 
                variant="primary" 
                aria-label="Submit test"
              >
                Submit Test
              </Button>
            )}
          </div>
        </div>
        
        {/* Sidebar with palette and navigation */}
        <div className="lg:col-span-2 flex flex-col items-center w-full mt-6 lg:mt-0">
          {/* Legend */}
          <div className="mb-4 w-full max-w-xs">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center">Question Status</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full bg-green-500"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full bg-purple-500"></span>
                <span>Marked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full bg-gray-300 border"></span>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full bg-red-500"></span>
                <span>Visited (no answer)</span>
              </div>
            </div>
          </div>
          
          {/* Question palette */}
          <div className="bg-white border rounded-lg p-4 shadow w-full max-w-xs overflow-x-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-2">
              {test.questions.map((q, index) => {
                const cls = getPaletteClass(q, index);
                const label = getQuestionKey(q, index);
                
                return (
                  <button
                    key={label}
                    className={`w-8 h-8 rounded-full font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200 ${cls}`}
                    aria-label={`Go to question ${index + 1}`}
                    onClick={() => handleGoToQuestion(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Progress summary */}
          <div className="mt-4 w-full max-w-xs bg-gray-50 rounded-lg p-3">
            <div className="text-center text-sm text-gray-600">
              <div className="font-medium mb-1">Progress</div>
              <div className="text-lg font-bold text-blue-600">
                {answeredCount}/{totalQuestions}
              </div>
              <div className="text-xs text-gray-500">
                {progressPercentage.toFixed(0)}% Complete
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTaking;

