import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import toast from "react-hot-toast";
import api from "../services/api";

const VIOLATION_LIMIT = 2;
const LOW_TIME_WARNING = 120;

function getQuestionKey(q, idx) {
  return q?._id ? String(q._id) : `q-${idx}`;
}
function isSingleType(q) {
  const t = (q?.type || "").toLowerCase();
  if (t === "single" || t === "radio" || t === "single-choice") return true;
  // Fallback: if only two options and no type, treat as single-choice
  if (!q?.type && Array.isArray(q?.options) && q.options.length === 2) return true;
  return false;
}
function formatTime(sec) {
  if (typeof sec !== "number" || sec < 0) return "--:--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TestTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [attemptCheckLoading, setAttemptCheckLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [visited, setVisited] = useState(new Set());
  const [markForReview, setMarkForReview] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [agreeInstructions, setAgreeInstructions] = useState(false);
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isSubmittingRef = useRef(false);
  const warnedRef = useRef(false);
  const answersRef = useRef(answers);
  const durationRef = useRef(durationMinutes);
  const localStorageKey = `testState-${id}`;

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    durationRef.current = durationMinutes;
  }, [durationMinutes]);

  // Restore state
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
    } catch {}
  }, [id]);

  // Fetch test and attempt check
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAttemptCheckLoading(true);
      setError("");
      try {
        const res = await api.get("/tests/results/student");
        if (res?.data?.results) {
          const attempted = res.data.results.some(
            (r) => r.test && (r.test._id === id || r.test === id)
          );
          if (attempted) setAlreadyAttempted(true);
        }
        const { data } = await api.get(`/tests/${id}`);
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
        setError("Failed to load test.");
        setTest(null);
      } finally {
        setLoading(false);
        setAttemptCheckLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Persist state
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
    } catch {}
  }, [
    answers,
    currentQuestionIndex,
    visited,
    markForReview,
    timeLeft,
    testStarted,
    localStorageKey,
  ]);

  // beforeunload
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
      } catch {}
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

  // Timer
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
          toast.success("Test auto-submitted (time up)");
          navigate("/tests");
        } catch {
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

  // Low time warning
  useEffect(() => {
    if (timeLeft !== null && timeLeft <= LOW_TIME_WARNING && testStarted) {
      toast.error("⚠️ Only 2 minutes left! Please submit soon.");
      warnedRef.current = true;
    }
  }, [timeLeft, testStarted]);

  // Mark visited
  useEffect(() => {
    if (!test?.questions?.[currentQuestionIndex]) return;
    const key = getQuestionKey(test.questions[currentQuestionIndex], currentQuestionIndex);
    setVisited(prev => prev.has(key) ? prev : new Set(prev).add(key));
  }, [currentQuestionIndex, test]);

  // Fullscreen & tab switch detection
  useEffect(() => {
    if (!testStarted) return;
    const isDocFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    const handleVisibility = () => {
      if (document.hidden) setViolations(v => v + 1);
    };
    const handleFullscreen = () => {
      setIsFullscreen(isDocFullscreen());
      if (!isDocFullscreen()) setViolations(v => v + 1);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.addEventListener("webkitfullscreenchange", handleFullscreen);
    document.addEventListener("mozfullscreenchange", handleFullscreen);
    document.addEventListener("MSFullscreenChange", handleFullscreen);
    setIsFullscreen(isDocFullscreen());
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("webkitfullscreenchange", handleFullscreen);
      document.removeEventListener("mozfullscreenchange", handleFullscreen);
      document.removeEventListener("MSFullscreenChange", handleFullscreen);
    };
  }, [testStarted]);

  // Auto-submit on violation
  useEffect(() => {
    if (violations > VIOLATION_LIMIT && testStarted && !isSubmittingRef.current) {
      isSubmittingRef.current = true;
      (async () => {
        try {
          const totalSeconds = (durationRef.current || durationMinutes || 0) * 60;
          const usedSeconds = Math.max(0, totalSeconds - (typeof timeLeft === "number" ? timeLeft : 0));
          const timeTaken = Math.ceil(usedSeconds / 60);
          await api.post(`/tests/${id}/submit`, { answers: answersRef.current, timeTaken, forced: true, autoSubmitReason: "violation" });
          localStorage.removeItem(localStorageKey);
          toast.error("Test auto-submitted due to rule violation");
          navigate("/tests");
        } catch {
          toast.error("Auto submission failed");
        }
      })();
    }
  }, [violations, testStarted, id, durationMinutes, timeLeft, navigate, localStorageKey]);

  // Guards
  useEffect(() => {
    if (alreadyAttempted && !attemptCheckLoading) {
      toast.error("You have already attempted this test.");
      navigate("/tests");
    }
  }, [alreadyAttempted, attemptCheckLoading, navigate]);

  // Handlers
  const handleStartTest = async () => {
    if (!durationMinutes) {
      toast.error("Test duration not available.");
      return;
    }
    if (!agreeInstructions) {
      toast.error("Please agree to the instructions.");
      return;
    }
    try {
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();
    } catch {}
    setAnswers({});
    setVisited(new Set());
    setMarkForReview({});
    setCurrentQuestionIndex(0);
    setTimeLeft(durationMinutes * 60);
    setTestStarted(true);
    setResumeAvailable(false);
    warnedRef.current = false;
  };
  const handleResumeTest = async () => {
    try {
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();
    } catch {}
    if (timeLeft === null && durationMinutes) setTimeLeft(durationMinutes * 60);
    setTestStarted(true);
    setResumeAvailable(false);
    warnedRef.current = false;
  };
  const handleAnswer = (questionIndex, option) => {
    if (!test?.questions?.[questionIndex]) return;
    const q = test.questions[questionIndex];
    const key = getQuestionKey(q, questionIndex);
    setAnswers(prev => {
      if (isSingleType(q)) return { ...prev, [key]: [option] };
      const prevForQ = Array.isArray(prev[key]) ? prev[key] : [];
      const exists = prevForQ.includes(option);
      const updated = exists ? prevForQ.filter(o => o !== option) : [...prevForQ, option];
      return { ...prev, [key]: updated };
    });
    setVisited(prev => prev.has(key) ? prev : new Set(prev).add(key));
  };
  const handleMarkForReview = () => {
    if (!test?.questions?.[currentQuestionIndex]) return;
    const q = test.questions[currentQuestionIndex];
    const key = getQuestionKey(q, currentQuestionIndex);
    setMarkForReview(prev => ({ ...prev, [key]: !prev[key] }));
    if (currentQuestionIndex < (test.questions?.length || 0) - 1) setCurrentQuestionIndex(i => i + 1);
  };
  const handleClearResponse = () => {
    if (!test?.questions?.[currentQuestionIndex]) return;
    const q = test.questions[currentQuestionIndex];
    const key = getQuestionKey(q, currentQuestionIndex);
    setAnswers(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
    setMarkForReview(prev => ({ ...prev, [key]: false }));
  };
  const handleGoToQuestion = (index) => {
    if (index < 0 || index >= (test.questions?.length || 0)) return;
    setCurrentQuestionIndex(index);
  };
  const handleSubmitTest = async () => {
    if (isSubmittingRef.current) return;
    // Pre-submit: check all questions answered
    const unanswered = test.questions.filter((q, idx) => {
      const key = getQuestionKey(q, idx);
      return !Array.isArray(answers[key]) || answers[key].length === 0;
    });
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions before submitting. (${unanswered.length} unanswered)`);
      return;
    }
    const ok = window.confirm("Are you sure you want to submit the test?");
    if (!ok) return;
    isSubmittingRef.current = true;
    try {
      const totalSeconds = (durationRef.current || durationMinutes || 0) * 60;
      const usedSeconds = Math.max(0, totalSeconds - (typeof timeLeft === "number" ? timeLeft : 0));
      const timeTaken = Math.ceil(usedSeconds / 60);
      await api.post(`/tests/${id}/submit`, { answers: answersRef.current, timeTaken });
      localStorage.removeItem(localStorageKey);
      toast.success("Test submitted successfully");
      navigate("/tests");
    } catch {
      toast.error("Submission failed");
      isSubmittingRef.current = false;
    }
  };

  // UI helpers
  const getPaletteClass = (q, idx) => {
    const key = getQuestionKey(q, idx);
    if (currentQuestionIndex === idx) return "bg-blue-600 text-white ring-2 ring-blue-400";
    if (markForReview[key]) return "bg-purple-500 text-white";
    if (Array.isArray(answers[key]) && answers[key].length > 0) return "bg-green-500 text-white";
    if (visited.has(key)) return "bg-red-500 text-white";
    return "bg-gray-300 text-gray-700";
  };


  // UI helpers
  const answeredCount = Object.values(answers).filter(a => Array.isArray(a) && a.length > 0).length;
  const resumeSummary = resumeAvailable ? (
    <div className="mb-4 text-sm text-gray-700">
      <div>Saved progress found for this test.</div>
      <div>Answered: <strong>{answeredCount}</strong> / {test?.questions?.length || 0}</div>
      <div>Time left (if resumed): <strong>{formatTime(timeLeft)}</strong></div>
    </div>
  ) : null;

  if (loading) return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-screen"><div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 max-w-lg w-full text-center"><h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1><p className="text-gray-700 mb-6">{error}</p><Button onClick={() => navigate("/tests")} variant="primary">Back to Tests</Button></div></div>;
  if (!test) return <div className="flex justify-center items-center h-screen"><p>Test not found</p></div>;

  const currentQ = test.questions?.[currentQuestionIndex] || null;
  const currentKey = currentQ ? getQuestionKey(currentQ, currentQuestionIndex) : null;

  if (attemptCheckLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
  }
  if (alreadyAttempted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 border border-gray-200 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">You have already attempted this test.</h1>
          <p className="text-gray-700 mb-6">You cannot retake this test. If you believe this is a mistake, please contact your instructor or admin.</p>
          <Button onClick={() => navigate("/tests")} variant="primary">Back to Tests</Button>
        </div>
      </div>
    );
  }
  if (!testStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-semibold text-gray-500 uppercase tracking-wide">Test</span>
            <span className="text-sm text-gray-400">Duration: <span className="font-semibold text-gray-700">{durationMinutes} min</span></span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-left">{test.title}</h1>
          <div className="mb-6"><div className="bg-yellow-50 border-l-4 border-yellow-400 rounded p-4 text-gray-900"><h2 className="font-semibold text-xl text-yellow-800 mb-2 flex items-center gap-2"><svg className="w-6 h-6 text-yellow-500 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>Test Instructions</h2><div className="whitespace-pre-line text-base">{test.instructions && test.instructions.trim().length > 0 ? test.instructions : "Please read all questions carefully. Do not refresh or close the browser during the test. Your answers will be auto-submitted when time is up."}</div></div></div>
          {resumeSummary}
          {!resumeAvailable ? (
            <>
              <div className="flex items-center gap-2 mb-6"><input type="checkbox" id="agreeInstructions" checked={!!agreeInstructions} onChange={e => setAgreeInstructions(e.target.checked)} className="mr-2" /><label htmlFor="agreeInstructions" className="text-gray-800 select-none cursor-pointer">I have read and agree to the instructions above.</label></div>
              <Button onClick={handleStartTest} disabled={!agreeInstructions || !durationMinutes} size="lg" className="w-full">Start Test</Button>
            </>
          ) : (
            <div className="flex flex-col gap-3"><Button onClick={handleResumeTest} size="lg" className="w-full">Resume Test</Button><Button onClick={() => { localStorage.removeItem(localStorageKey); setResumeAvailable(false); setAnswers({}); setVisited(new Set()); setMarkForReview({}); setAgreeInstructions(false); if (durationMinutes) setTimeLeft(durationMinutes * 60); }} variant="secondary" size="lg" className="w-full">Start Fresh (clear saved)</Button></div>
          )}
        </div>
      </div>
    );
  }
  // Test in progress
  return (
    <div className="max-w-5xl mx-auto p-4" aria-label="Test Taking Page">
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-4"><span className="text-lg font-bold text-green-700 bg-green-100 px-3 py-1 rounded">{test.title}</span><span className="text-lg font-mono text-blue-700 bg-blue-100 px-3 py-1 rounded">{formatTime(timeLeft)}</span></div>
          <div className="mb-2 text-gray-600 text-sm">Question {currentQuestionIndex + 1} of {test.questions.length}</div>
          <div className="text-lg font-medium mb-2">{currentQ ? (currentQ.question || currentQ.text || currentQ.questionText) : "Question not available"}</div>
          <div className="space-y-2">
            {currentQ && currentQ.options && currentQ.options.map((opt, i) => {
              const key = getQuestionKey(currentQ, currentQuestionIndex);
              const isSingle = isSingleType(currentQ);
              if (process.env.NODE_ENV !== 'production') {
                // Debug: log type detection
                // eslint-disable-next-line no-console
                console.log(`Q${currentQuestionIndex + 1} type:`, currentQ.type, 'isSingle:', isSingle, 'options:', currentQ.options);
              }
              const selected = Array.isArray(answers[key]) && answers[key].includes(opt);
              return (
                <label key={i} className="block cursor-pointer">
                  <input
                    type={isSingle ? "radio" : "checkbox"}
                    name={key}
                    checked={!!selected}
                    onChange={() => handleAnswer(currentQuestionIndex, opt)}
                    className="mr-2"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
          <div className="flex gap-2 mt-6 flex-wrap"><Button onClick={handleMarkForReview} variant={markForReview[currentKey] ? "primary" : "secondary"}>{markForReview[currentKey] ? "Unmark Review" : "Mark for Review & Next"}</Button><Button onClick={handleClearResponse} variant="secondary" aria-label="Clear Response">Clear Response</Button><Button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))} variant="secondary" aria-label="Previous Question">Previous</Button>{currentQuestionIndex < test.questions.length - 1 ? (<Button onClick={() => setCurrentQuestionIndex(i => Math.min(test.questions.length - 1, i + 1))} variant="secondary" aria-label="Next Question">Next</Button>) : (<Button onClick={handleSubmitTest} variant="primary" aria-label="Submit Test">Submit</Button>)}</div>
        </div>
        <div className="col-span-2 flex flex-col items-center"><div className="mb-4 w-full max-w-xs"><div className="flex flex-wrap gap-2 justify-center text-sm"><span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-full bg-green-500"></span>Answered</span><span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-full bg-purple-500"></span>Marked</span><span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-full bg-gray-300 border"></span>Not Visited</span><span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-full bg-red-500"></span>Visited (no answer)</span></div></div><div className="bg-white border rounded-lg p-4 shadow w-full max-w-xs"><div className="grid grid-cols-5 gap-2">{test.questions.map((q, index) => { const cls = getPaletteClass(q, index); const label = getQuestionKey(q, index); return (<button key={label} className={`w-8 h-8 rounded-full font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200 ${cls}`} aria-label={`Go to question ${index + 1}`} onClick={() => handleGoToQuestion(index)}>{index + 1}</button>); })}</div></div></div></div>
      </div>
   
  );
};

export default TestTaking;

