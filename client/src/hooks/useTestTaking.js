import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const useTestTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Core state
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  
  // Test session state
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());
  const [markedForReview, setMarkedForReview] = useState(new Set());
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(null);
  const [duration, setDuration] = useState(null);
  
  // UI state
  const [showInstructions, setShowInstructions] = useState(true);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [violations, setViolations] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  
  // Refs
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const localStorageKey = `testState-${id}`;
  const warnedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const tabToastShownRef = useRef(false);
  const fullscreenToastShownRef = useRef(false);
  const endTimeRef = useRef(null);
  const warned30Ref = useRef(false);
  const warned5Ref = useRef(false);
  const warn30Ref = useRef(false);
  const warn5Ref = useRef(false);

  // Load test data
  useEffect(() => {
    const loadTest = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Check if already attempted
        const resultsResponse = await api.get("/tests/results/student");
        if (resultsResponse?.data?.results) {
          const attempted = resultsResponse.data.results.some(
            (result) => result.test && (result.test._id === id || result.test === id)
          );
          if (attempted) {
            setAlreadyAttempted(true);
            return;
          }
        }
        
        // Load test
        const testResponse = await api.get(`/tests/${id}`);
        const testData = testResponse.data.test || testResponse.data;
        
        if (!testData || !Array.isArray(testData.questions) || testData.questions.length === 0) {
          setError("Test not found or has no questions.");
          return;
        }
        
        setTest(testData);
        setDuration(testData.duration || testData.durationMinutes);
        
        // Load saved state
        loadSavedState(testData);
        
      } catch (err) {
        console.error("Error loading test:", err);
        setError("Failed to load test. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadTest();
  }, [id]);

  // Load saved state from localStorage
  const loadSavedState = useCallback((testData) => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (!saved) return;
      
      const parsed = JSON.parse(saved);
      
      if (parsed.answers) setAnswers(parsed.answers);
      if (parsed.currentQuestionIndex !== undefined) setCurrentQuestionIndex(parsed.currentQuestionIndex);
      if (parsed.visitedQuestions) setVisitedQuestions(new Set(parsed.visitedQuestions));
      if (parsed.markedForReview) setMarkedForReview(new Set(parsed.markedForReview));
      if (parsed.timeLeft !== undefined) setTimeLeft(parsed.timeLeft);
      if (parsed.testStarted) setTestStarted(parsed.testStarted);
      if (parsed.endTime) endTimeRef.current = parsed.endTime;
      
    } catch (err) {
      console.error("Error loading saved state:", err);
    }
  }, [localStorageKey]);

  // Save state to localStorage
  const saveState = useCallback(() => {
    try {
      const state = {
        answers,
        currentQuestionIndex,
        visitedQuestions: Array.from(visitedQuestions),
        markedForReview: Array.from(markedForReview),
        timeLeft,
        testStarted,
        endTime: endTimeRef.current,
        timestamp: Date.now()
      };
      localStorage.setItem(localStorageKey, JSON.stringify(state));
    } catch (err) {
      console.error("Error saving state:", err);
    }
  }, [answers, currentQuestionIndex, visitedQuestions, markedForReview, timeLeft, testStarted, localStorageKey]);

  // Auto-save state
  useEffect(() => {
    if (!testStarted) return;
    
    autoSaveRef.current = setInterval(saveState, 30000); // 30 seconds
    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [testStarted, saveState]);

  // Timer effect (driven by fixed endTime)
  useEffect(() => {
    if (!testStarted || !endTimeRef.current) return;
    
    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((endTimeRef.current - now) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        handleTimeUp();
      }
    };
    
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testStarted]);

  // Low time warning (30s and 5s)
  useEffect(() => {
    if (!testStarted) return;
    if (typeof timeLeft !== 'number') return;
    if (timeLeft <= 30 && !warn30Ref.current && timeLeft > 5) {
      toast.error('⏳ Only 30 seconds left! Please prepare to submit.');
      warn30Ref.current = true;
    }
    if (timeLeft <= 5 && !warn5Ref.current && timeLeft > 0) {
      toast.error('⚠️ 5 seconds remaining. Submit now to avoid errors.');
      warn5Ref.current = true;
    }
  }, [timeLeft, testStarted]);

  // Mark question as visited
  useEffect(() => {
    if (!test?.questions?.[currentQuestionIndex]) return;
    
    const questionKey = getQuestionKey(test.questions[currentQuestionIndex], currentQuestionIndex);
    setVisitedQuestions(prev => new Set(prev).add(questionKey));
  }, [currentQuestionIndex, test]);

  // Enhanced security monitoring
  useEffect(() => {
    if (!testStarted) return;
    
    const checkFullscreen = () => {
      const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || 
                              document.mozFullScreenElement || document.msFullscreenElement);
      
      if (!isFullscreen) {
        setViolations(v => v + 1);
        if (!fullscreenToastShownRef.current) {
          toast.error("⚠️ Fullscreen mode required! Please return to fullscreen immediately.");
          fullscreenToastShownRef.current = true;
        }
        
        // Auto-request fullscreen again
        setTimeout(() => {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {
              // If fullscreen fails, add another violation
              setViolations(v => v + 1);
            });
          }
        }, 1000);
      } else {
        // Reset toast gate when user is back in fullscreen
        fullscreenToastShownRef.current = false;
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(c => c + 1);
        if (!tabToastShownRef.current) {
          toast.error("⚠️ Tab switch detected! Please stay on the test page.");
          tabToastShownRef.current = true;
        }
      }
    };
    
    const handleFullscreenChange = () => {
      checkFullscreen();
    };
    
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Your test is in progress. Are you sure you want to leave?";
      saveState();
    };
    
    // Check fullscreen every 2 seconds
    const fullscreenCheckInterval = setInterval(checkFullscreen, 2000);
    
    // Monitor fullscreen changes
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    
    // Monitor tab visibility
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Monitor window focus
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("blur", () => {
      setTabSwitchCount(c => c + 1);
      if (!tabToastShownRef.current) {
        toast.error("⚠️ Window focus lost! Please return to the test immediately.");
        tabToastShownRef.current = true;
      }
    });
    
    return () => {
      clearInterval(fullscreenCheckInterval);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("blur", () => {});
    };
  }, [testStarted, saveState]);

  // Auto-submit on tab switching > 3
  useEffect(() => {
    if (tabSwitchCount >= 4 && testStarted && !isSubmittingRef.current) {
      toast.error("Too many tab switches detected. Auto-submitting test...");
      submitTest(true);
    }
  }, [tabSwitchCount, testStarted]);

  // (Note) We no longer auto-submit based on generic violations; violations are tracked for auditing only.

  // Utility functions
  const getQuestionKey = (question, index) => {
    return question?._id ? String(question._id) : `q-${index}`;
  };

  const isSingleChoice = (question) => {
    const type = (question?.type || "").toLowerCase();
    return type === "single" || type === "radio" || type === "single-choice";
  };

  const formatTime = (seconds) => {
    if (typeof seconds !== "number" || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Event handlers
  const handleStartTest = async () => {
    if (!agreeToTerms) {
      toast.error("Please agree to the test instructions before starting.");
      return;
    }
    
    if (!duration) {
      toast.error("Test duration not available.");
      return;
    }
    
    try {
      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      
      const endTime = Date.now() + duration * 60 * 1000;
      endTimeRef.current = endTime;
      setTimeLeft(Math.round((endTime - Date.now()) / 1000));
      setTestStarted(true);
      setShowInstructions(false);
      warnedRef.current = false;
      // Mark exam active globally for UI (e.g., disable sidebar)
      try { localStorage.setItem('examActive', '1'); } catch {}
      
      toast.success("Test started! Good luck!");
    } catch (err) {
      console.error("Error starting test:", err);
      toast.error("Failed to start test. Please try again.");
    }
  };

  const handleResumeTest = async () => {
    try {
      // Enforce fullscreen on resume
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      
      // If we have an endTime persisted, derive timeLeft
      if (!endTimeRef.current && duration) {
        // fallback: set new end time from current timeLeft if available else full duration
        const fallbackSeconds = typeof timeLeft === 'number' ? timeLeft : duration * 60;
        endTimeRef.current = Date.now() + fallbackSeconds * 1000;
      }
      setTestStarted(true);
      setShowInstructions(false);
      warnedRef.current = false;
      try { localStorage.setItem('examActive', '1'); } catch {}
      toast.success("Test resumed! Fullscreen mode enforced.");
    } catch (err) {
      console.error("Error resuming test:", err);
      toast.error("Failed to resume test. Please try again.");
    }
  };

  const handleAnswerChange = (questionIndex, option) => {
    if (!test?.questions?.[questionIndex]) return;
    
    const question = test.questions[questionIndex];
    const questionKey = getQuestionKey(question, questionIndex);
    
    setAnswers(prev => {
      const newAnswers = { ...prev };
      
      // Always treat as single choice for security - only allow one answer per question
      newAnswers[questionKey] = [option];
      
      return newAnswers;
    });
  };

  const handleMarkForReview = () => {
    if (!test?.questions?.[currentQuestionIndex]) return;
    
    const questionKey = getQuestionKey(test.questions[currentQuestionIndex], currentQuestionIndex);
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionKey)) {
        newSet.delete(questionKey);
        toast.success("Question unmarked for review");
      } else {
        newSet.add(questionKey);
        toast.success("Question marked for review");
      }
      return newSet;
    });
  };

  const handleClearResponse = () => {
    if (!test?.questions?.[currentQuestionIndex]) return;
    
    const questionKey = getQuestionKey(test.questions[currentQuestionIndex], currentQuestionIndex);
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionKey];
      return newAnswers;
    });
    
    toast.success("Response cleared");
  };

  const handleNavigateToQuestion = (index) => {
    if (index >= 0 && index < (test?.questions?.length || 0)) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleTimeUp = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    toast.error("Time's up! Auto-submitting your test...");
    await submitTest(true);
  };

  const submitTest = async (isAutoSubmit = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    try {
      // Convert answers to backend format
      const formattedAnswers = test.questions.map((question, index) => {
        const questionKey = getQuestionKey(question, index);
        const userAnswer = answers[questionKey] || [];
        
        return {
          questionIndex: index,
          selectedAnswer: userAnswer.length > 0 ? userAnswer[0] : null,
        };
      });
      
      const totalSeconds = duration ? duration * 60 : 0;
      const usedSeconds = endTimeRef.current ? Math.max(0, Math.round((totalSeconds - Math.max(0, timeLeft || 0)))) : Math.max(0, totalSeconds - (timeLeft || 0));
      const timeTaken = Math.ceil(usedSeconds / 60);
      
      await api.post(`/tests/${id}/submit`, {
        answers: formattedAnswers,
        timeTaken,
        autoSubmit: isAutoSubmit
      });
      
      // Fire-and-forget: create a minimal feedback entry for admin visibility
      try {
        const title = (test && test.title) ? ` for "${test.title}"` : '';
        await api.post('/feedback', { message: `Test submitted${title}. AutoSubmit: ${isAutoSubmit ? 'Yes' : 'No'}.` });
      } catch {}
      
      // Clear saved state
      localStorage.removeItem(localStorageKey);
      try { localStorage.removeItem('examActive'); } catch {}
      
      toast.success(isAutoSubmit ? "Test auto-submitted" : "Test submitted successfully!");
      navigate('/results');
      
    } catch (err) {
      console.error("Error submitting test:", err);
      toast.error("Failed to submit test. Please try again.");
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSubmitTest = async () => {
    if (isSubmittingRef.current) return;
    
    // Check if all questions are answered (if required)
    if (test?.requireAllQuestions) {
      const unansweredCount = test.questions.filter((question, index) => {
        const questionKey = getQuestionKey(question, index);
        const userAnswer = answers[questionKey];
        return !userAnswer || userAnswer.length === 0;
      }).length;
      
      if (unansweredCount > 0) {
        toast.error(`Please answer all questions before submitting. (${unansweredCount} unanswered)`);
        return;
      }
    }
    
    const confirmed = window.confirm(
      "Are you sure you want to submit your test? This action cannot be undone."
    );
    
    if (confirmed) {
      await submitTest(false);
    }
  };

  const handleStartFresh = () => {
    localStorage.removeItem(localStorageKey);
    setAnswers({});
    setVisitedQuestions(new Set());
    setMarkedForReview(new Set());
    setCurrentQuestionIndex(0);
    setTimeLeft(duration ? duration * 60 : null);
    setTestStarted(false);
    setShowInstructions(true);
    setAgreeToTerms(false);
    try { localStorage.removeItem('examActive'); } catch {}
    toast.success("Test state cleared. You can start fresh.");
  };

  // Helper functions for UI
  const getQuestionStatus = (question, index) => {
    const questionKey = getQuestionKey(question, index);
    
    if (markedForReview.has(questionKey)) return "marked";
    if (answers[questionKey] && answers[questionKey].length > 0) return "answered";
    if (visitedQuestions.has(questionKey)) return "visited";
    return "unvisited";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "answered": return "bg-green-500 text-white";
      case "marked": return "bg-purple-500 text-white";
      case "visited": return "bg-yellow-500 text-white";
      case "current": return "bg-blue-600 text-white ring-2 ring-blue-400";
      default: return "bg-gray-300 text-gray-700";
    }
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(answer => answer && answer.length > 0).length;
  };

  return {
    // State
    test,
    loading,
    error,
    alreadyAttempted,
    testStarted,
    currentQuestionIndex,
    answers,
    visitedQuestions,
    markedForReview,
    timeLeft,
    duration,
    showInstructions,
    agreeToTerms,
    violations,
    tabSwitchCount,
    isSubmitting,
    showQuestionPalette,
    
    // Setters
    setAgreeToTerms,
    setShowQuestionPalette,
    
    // Handlers
    handleStartTest,
    handleResumeTest,
    handleAnswerChange,
    handleMarkForReview,
    handleClearResponse,
    handleNavigateToQuestion,
    handleSubmitTest,
    handleStartFresh,
    
    // Utilities
    getQuestionStatus,
    getStatusColor,
    getAnsweredCount,
    formatTime,
    isSingleChoice,
    getQuestionKey
  };
};

export default useTestTaking;
