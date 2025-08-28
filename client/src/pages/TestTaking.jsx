import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import toast from "react-hot-toast";
import api from "../services/api";

/**
 * TestTaking Component
 *
 * Features:
 * - Fetches questions from backend API using test ID
 * - Handles both single-choice and multi-choice questions
 * - Timer functionality with auto-submit when time runs out
 * - Autosave state to localStorage to support resume
 * - Auto submission on tab switch / window blur violations (3-strike rule)
 * - UI includes question navigation panel, marking for review, progress tracking
 * - Responsive Tailwind UI layout with accessible components
 */

const TestTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // -------------------------------
  // State Definitions
  // -------------------------------
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [violations, setViolations] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [loading, setLoading] = useState(true);

  // -------------------------------
  // Refs for stable values
  // -------------------------------
  const timerRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const answersRef = useRef({});
  const durationRef = useRef(null);

  // -------------------------------
  // Constants
  // -------------------------------
  const localStorageKey = `test-${id}-state`;
  const VIOLATION_LIMIT = 3; // end test after 3 violations

  // -------------------------------
  // Utility Functions
  // -------------------------------

  /**
   * Generate stable key for a question
   */
  const getQuestionKey = (q, index) => {
    return q._id || `q-${index}`;
  };

  /**
   * Detect if question type is single choice
   */
  const isSingleType = (q) => {
    return q.type === "single" || q.type === "radio" || q.type === "single-choice";
  };

  /**
   * Save state to localStorage for resume
   */
  const saveState = (state) => {
    localStorage.setItem(localStorageKey, JSON.stringify(state));
  };

  /**
   * Load saved state from localStorage
   */
  const loadState = () => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error("Failed to parse saved state", err);
      return null;
    }
  };

  // -------------------------------
  // Fetch Test Data
  // -------------------------------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/tests/${id}`);
        const { questions, durationMinutes } = res.data;

        setQuestions(questions || []);
        setDurationMinutes(durationMinutes);
        durationRef.current = durationMinutes;

        const savedState = loadState();
        if (savedState && savedState.answers && savedState.timeLeft) {
          setAnswers(savedState.answers);
          answersRef.current = savedState.answers;
          setMarked(savedState.marked || {});
          setCurrentQuestionIndex(savedState.currentQuestionIndex || 0);
          setTimeLeft(savedState.timeLeft);
          setViolations(savedState.violations || 0);
        } else {
          setTimeLeft(durationMinutes * 60);
        }

        setTestStarted(true);
      } catch (err) {
        toast.error("Failed to load test");
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // -------------------------------
  // Timer Effect
  // -------------------------------
  useEffect(() => {
    if (!testStarted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true, "timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [testStarted]);

  // -------------------------------
  // Violation Effect (3 strikes rule)
  // -------------------------------
  useEffect(() => {
    if (violations >= VIOLATION_LIMIT && testStarted && !isSubmittingRef.current) {
      handleSubmit(true, "violation");
    }
  }, [violations, testStarted]);

  // -------------------------------
  // Window Events for Violations
  // -------------------------------
  useEffect(() => {
    const handleBlur = () => {
      setViolations((v) => v + 1);
      toast.error("⚠️ You switched tabs or windows. Strike added.");
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  // -------------------------------
  // Autosave Effect
  // -------------------------------
  useEffect(() => {
    if (!testStarted) return;

    const state = {
      answers,
      marked,
      currentQuestionIndex,
      timeLeft,
      violations,
    };

    saveState(state);
  }, [answers, marked, currentQuestionIndex, timeLeft, violations, testStarted]);

  // -------------------------------
  // Answer Handling
  // -------------------------------
  const handleAnswer = (qIndex, option) => {
    const q = questions[qIndex];
    if (!q) return;

    const key = getQuestionKey(q, qIndex);
    const isSingle = isSingleType(q);

    setAnswers((prev) => {
      let updated;
      if (isSingle) {
        updated = { ...prev, [key]: [option] };
      } else {
        const existing = prev[key] || [];
        if (existing.includes(option)) {
          updated = { ...prev, [key]: existing.filter((o) => o !== option) };
        } else {
          updated = { ...prev, [key]: [...existing, option] };
        }
      }
      answersRef.current = updated;
      return updated;
    });
  };

  const toggleMark = (qIndex) => {
    const q = questions[qIndex];
    if (!q) return;
    const key = getQuestionKey(q, qIndex);
    setMarked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // -------------------------------
  // Submit Handler
  // -------------------------------
  const handleSubmit = async (forced = false, reason = "manual") => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      const totalSeconds = (durationRef.current || durationMinutes || 0) * 60;
      const usedSeconds = Math.max(0, totalSeconds - (typeof timeLeft === "number" ? timeLeft : 0));
      const timeTaken = Math.ceil(usedSeconds / 60);

      await api.post(`/tests/${id}/submit`, {
        answers: answersRef.current,
        timeTaken,
        forced,
        autoSubmitReason: reason,
      });

      localStorage.removeItem(localStorageKey);

      if (forced && reason === "timeout") {
        toast("⏰ Test auto-submitted due to timeout");
      } else if (forced && reason === "violation") {
        toast.error("❌ Test ended due to 3 violations");
      } else {
        toast.success("✅ Test submitted successfully");
      }

      navigate("/tests");
    } catch (err) {
      console.error("Submit error", err);
      toast.error("Failed to submit test");
      isSubmittingRef.current = false;
    }
  };

  // -------------------------------
  // Render Helpers
  // -------------------------------
  const renderOptions = (q, qIndex) => {
    const key = getQuestionKey(q, qIndex);
    const selectedOptions = answers[key] || [];
    const isSingle = isSingleType(q);

    return (
      <div className="space-y-2 mt-4">
        {q.options.map((opt, i) => {
          const selected = selectedOptions.includes(opt);
          return (
            <label key={i} className="flex items-center space-x-2 cursor-pointer">
              <input
                type={isSingle ? "radio" : "checkbox"}
                name={key}
                value={opt}
                checked={!!selected}
                onChange={() => handleAnswer(qIndex, opt)}
                className="mr-2"
              />
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
    );
  };

  const renderQuestion = () => {
    const q = questions[currentQuestionIndex];
    if (!q) return <div>No questions available</div>;

    return (
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold">Question {currentQuestionIndex + 1}</h2>
        <p className="mt-2">{q.text}</p>
        {renderOptions(q, currentQuestionIndex)}
        <div className="mt-4 flex space-x-2">
          <Button onClick={() => toggleMark(currentQuestionIndex)}>
            {marked[getQuestionKey(q, currentQuestionIndex)] ? "Unmark" : "Mark for Review"}
          </Button>
        </div>
      </div>
    );
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // -------------------------------
  // Render
  // -------------------------------
  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      {/* Sidebar with question navigation */}
      <div className="col-span-1 bg-gray-50 p-4 rounded shadow space-y-2">
        <h2 className="font-semibold text-lg">Questions</h2>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {questions.map((q, i) => {
            const key = getQuestionKey(q, i);
            const answered = answers[key] && answers[key].length > 0;
            const isMarked = marked[key];
            return (
              <button
                key={i}
                className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium
                  ${i === currentQuestionIndex ? "bg-blue-500 text-white" : "bg-white border"}
                  ${answered ? "bg-green-500 text-white" : ""}
                  ${isMarked ? "bg-purple-500 text-white" : ""}`}
                onClick={() => setCurrentQuestionIndex(i)}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <p><b>Time Left:</b> {formatTime(timeLeft)}</p>
          <p><b>Violations:</b> {violations}/{VIOLATION_LIMIT}</p>
        </div>

        <Button onClick={() => handleSubmit(false, "manual")} className="mt-4 w-full">
          Submit Test
        </Button>
      </div>

      {/* Main Question Panel */}
      <div className="col-span-3">
        {renderQuestion()}

        <div className="mt-6 flex justify-between">
          <Button
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex((i) => i - 1)}
          >
            Previous
          </Button>
          <Button
            disabled={currentQuestionIndex === questions.length - 1}
            onClick={() => setCurrentQuestionIndex((i) => i + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestTaking;