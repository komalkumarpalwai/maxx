// StartTest.jsx
import React, { useState, useEffect, useRef, useCallback, createContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import api from "../services/api";

// --- Config ---
const VIOLATION_LIMIT = 3; // auto-submit when user violates this many times
const LOW_TIME_WARNING = 120; // seconds remaining to show low time warning
const WARNING_TOAST_ID = "low-time-warning";
const AUTOSAVE_INTERVAL_MS = 15000; // autosave every 15s

// --- Helpers ---
function getQuestionKey(q, idx) {
  return q?._id ? String(q._id) : `q-${idx}`;
}
function formatTime(sec) {
  if (typeof sec !== "number" || sec < 0) return "--:--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const DisableNavContext = createContext(false);

const StartTest = () => {
  const [autoSubmitMessage, setAutoSubmitMessage] = useState("");
  // Disable right-click globally
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- State ---
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [answers, setAnswers] = useState({}); // { [questionKey]: optionIndex }
  const [visited, setVisited] = useState(new Set());
  const [markForReview, setMarkForReview] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [durationMinutes, setDurationMinutes] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null); // seconds

  // We render the main UI immediately; testStarted toggles secure exam behavior
  const [testStarted] = useState(true);

  const [violations, setViolations] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(
    !!document.fullscreenElement || !!document.webkitFullscreenElement
  );

  const [lastSavedAt, setLastSavedAt] = useState(null);
  const localStorageKey = `testState-${id}`;

  // --- Refs ---
  const isSubmittingRef = useRef(false);
  const answersRef = useRef({});
  const durationRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // keep latest values synced to refs
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    durationRef.current = durationMinutes;
  }, [durationMinutes]);

  // --- Fetch test data ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/tests/${id}`);
        const testObj = data.test || data;
        if (!testObj || !Array.isArray(testObj.questions) || testObj.questions.length === 0) {
          if (!cancelled) {
            setError("Test not found or has no questions.");
            setTest(null);
          }
        } else {
          if (!cancelled) {
            setTest(testObj);
            const dur = Number(testObj?.duration) || Number(testObj?.durationMinutes) || null;
            setDurationMinutes(dur);
            durationRef.current = dur;
            setTimeLeft(dur ? dur * 60 : null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load test.");
          setTest(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // --- Device restriction check ---
  useEffect(() => {
    if (!test) return;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    if (test.deviceRestriction === "mobile" && !isMobile) {
      setError("This test is only accessible on mobile devices.");
    } else if (test.deviceRestriction === "desktop" && isMobile) {
      setError("This test is only accessible on desktop/laptop devices.");
    }
  }, [test]);

  // --- Restore saved state (if any) once test loads ---
  useEffect(() => {
    if (!test) return;
    try {
      const savedRaw = localStorage.getItem(localStorageKey);
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        setAnswers(saved.answers || {});
        setVisited(new Set(saved.visited || []));
        setMarkForReview(saved.markForReview || {});
        setCurrentQuestionIndex(
          Math.min(saved.currentQuestionIndex || 0, test.questions.length - 1)
        );
        if (typeof saved.timeLeft === "number") {
          const maxTime = ((Number(test.duration) || Number(test.durationMinutes) || 0) * 60) || 0;
          setTimeLeft(maxTime ? Math.min(saved.timeLeft, maxTime) : saved.timeLeft);
        }
        setViolations(saved.violations || 0);
      }
    } catch (err) {
      // ignore parse errors
      // console.warn("Failed to restore saved test state", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test]);

  // --- Autosave every AUTOSAVE_INTERVAL_MS ---
  useEffect(() => {
    if (!test) return;
    // clear existing
    if (autosaveTimerRef.current) {
      clearInterval(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setInterval(() => {
      const state = {
        answers: answersRef.current,
        currentQuestionIndex,
        visited: Array.from(visited),
        markForReview,
        timeLeft,
        testStarted: true,
        violations,
      };
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(state));
        setLastSavedAt(Date.now());
      } catch (err) {
        // ignore storage errors
      }
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [test, currentQuestionIndex, visited, markForReview, timeLeft, violations, localStorageKey]);

  // --- Mark current as visited ---
  useEffect(() => {
    if (!test?.questions?.[currentQuestionIndex]) return;
    const key = getQuestionKey(test.questions[currentQuestionIndex], currentQuestionIndex);
    setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, [currentQuestionIndex, test]);

  // --- Track fullscreen status ---
  useEffect(() => {
    const onFsChange = () => {
      const fs = !!document.fullscreenElement || !!document.webkitFullscreenElement;
      setIsFullscreen(fs);
      setPaused(!fs);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    onFsChange();
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // --- Count tab switches as violations ---
  useEffect(() => {
    if (!testStarted) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setViolations((v) => {
          const nv = v + 1;
          // show toast
          toast.error("Tab switch detected. This is a violation.");
          return nv;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [testStarted]);

  // --- Auto-submit if violations exceed limit ---
  useEffect(() => {
    if (violations >= VIOLATION_LIMIT && !isSubmittingRef.current) {
      isSubmittingRef.current = true;
      toast.error("Violation limit exceeded — auto-submitting the test.");
      handleSubmitTest(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [violations]);

  // --- Timer: countdown and auto-submit on zero ---
  useEffect(() => {
    // clear existing interval if any
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // only run timer if testStarted, we have a valid numeric timeLeft, and not paused
    if (testStarted && typeof timeLeft === "number" && !paused) {
      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (typeof prev !== "number") return prev;
          const next = Math.max(0, prev - 1);
          const total = ((Number(test?.duration) || Number(test?.durationMinutes) || 0) * 60) || 0;

          // Half time notification (only once when reaching exactly half)
          if (prev === Math.floor(total / 2) && total > 0) {
            toast("⏳ Half time left!", { icon: "⏳", duration: 4000 });
          }

          // Low time warning (e.g., 2 minutes left)
          if (prev === LOW_TIME_WARNING) {
            toast.error("⚠️ Only 2 minutes left. Please review and submit.", {
              id: WARNING_TOAST_ID,
            });
          }

          // When time reaches zero, auto-submit (with a tiny delay to ensure UI updates)
          if (next === 0 && !isSubmittingRef.current) {
            // clear the interval immediately to avoid racing updates
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            // set a tiny timeout to let UI show 00:00 before submitting
            setAutoSubmitMessage("Time's up! Your test is being auto-submitted...");
            toast.loading("Time's up — auto-submitting the test...", { id: "autosubmit" });
            setTimeout(() => {
              handleSubmitTest(true);
            }, 150);
          }

          return next;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [testStarted, paused, timeLeft, test]);

  // --- Warn on refresh/close (prevent accidental close while not submitting) ---
  useEffect(() => {
    const beforeUnload = (e) => {
      if (!isSubmittingRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  // --- Handlers ---
  const handleAnswer = useCallback(
    (questionIndex, option) => {
      if (!test?.questions?.[questionIndex]) return;
      const q = test.questions[questionIndex];
      const key = getQuestionKey(q, questionIndex);
      setAnswers((prev) => {
        const copy = { ...prev, [key]: option };
        answersRef.current = copy;
        return copy;
      });
      setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
    },
    [test]
  );

  const handleMarkForReview = useCallback(() => {
    if (!test?.questions?.[currentQuestionIndex]) return;
    const q = test.questions[currentQuestionIndex];
    const key = getQuestionKey(q, currentQuestionIndex);
    setMarkForReview((prev) => ({ ...prev, [key]: !prev[key] }));
  }, [currentQuestionIndex, test]);

  const handleClearResponse = useCallback(() => {
    if (!test?.questions?.[currentQuestionIndex]) return;
    const q = test.questions[currentQuestionIndex];
    const key = getQuestionKey(q, currentQuestionIndex);
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[key];
      answersRef.current = copy;
      return copy;
    });
    setMarkForReview((prev) => ({ ...prev, [key]: false }));
  }, [currentQuestionIndex, test]);

  const handleGoToQuestion = useCallback(
    (index) => {
      if (index < 0 || index >= (test?.questions?.length || 0)) return;
      setCurrentQuestionIndex(index);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [test]
  );

  /**
   * handleSubmitTest
   * - forced = true is used for auto-submit (violations/timeouts)
   * - locks submission to prevent double submits
   * - calculates timeTaken (in minutes) and sends answers
   */
  async function handleSubmitTest(forced = false) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      const latestAnswers = answersRef.current || {};
      // If manual submit and requireAllQuestions, block
      if (!forced && test?.requireAllQuestions) {
        const unanswered = test.questions.filter((q, idx) => {
          const key = getQuestionKey(q, idx);
          return latestAnswers[key] === undefined || latestAnswers[key] === null;
        });
        if (unanswered.length > 0) {
          toast.error(
            `Please answer all questions before submitting. (${unanswered.length} unanswered)`
          );
          isSubmittingRef.current = false;
          return;
        }
      }

      // calculate time taken (in minutes)
      const totalSeconds = (durationRef.current || durationMinutes || 0) * 60;
      const usedSeconds = Math.max(
        0,
        totalSeconds - (typeof timeLeft === "number" ? timeLeft : 0)
      );
      const timeTaken = Math.ceil(usedSeconds / 60);

      // prepare payload
      let payloadAnswers;
      if (forced) {
        // For forced/violation/timeouts, send answers as object (server likely expects this)
        payloadAnswers = { ...latestAnswers };
      } else {
        // For manual submit, send as array with explicit selectedAnswer for each question
        payloadAnswers = test.questions.map((q, idx) => {
          const key = getQuestionKey(q, idx);
          const ans = latestAnswers[key];
          return { selectedAnswer: typeof ans === "number" ? ans : null };
        });
      }

      // show submitting toast
      const submittingToastId = toast.loading(forced ? "Auto-submitting..." : "Submitting test...");

      // call server
      const res = await api.post(`/tests/${id}/submit`, {
        answers: payloadAnswers,
        timeTaken,
        ...(forced ? { forced: true, autoSubmitReason: "violation_or_timeout" } : {}),
      });

      // on success
      toast.dismiss(submittingToastId);
      toast.success(forced ? "Test auto-submitted." : "✅ Test submitted successfully!");
      // remove saved local state
      try {
        localStorage.removeItem(localStorageKey);
      } catch (err) {
        // ignore
      }

      // attempt to get result id from response, fallback to test id
      const resultId =
        res?.data?.resultId || res?.data?.result?.id || res?.data?.result?._id || null;

      // small delay to allow UI to settle
      setTimeout(() => {
        if (forced) {
          // navigate to result view. Prefer explicit resultId if backend returned one.
          if (resultId) navigate(`/results/${resultId}`);
          else navigate(`/results/${id}`);
        } else {
          // for manual submission, go to tests list or results depending on your app flow
          if (resultId) navigate(`/results/${resultId}`);
          else navigate("/tests");
        }
      }, 200);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Submission failed. Please try again.";
      toast.error(errorMessage);
      // allow retrying submission
      isSubmittingRef.current = false;
    }
  }

  // --- render loading/error states ---
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600">Test not found</p>
      </div>
    );
  }

  // --- derived values ---
  const question = test.questions?.[currentQuestionIndex];
  const key = question ? getQuestionKey(question, currentQuestionIndex) : null;
  const savedLabel = lastSavedAt
    ? `${Math.max(0, Math.floor((Date.now() - lastSavedAt) / 1000))} seconds ago`
    : "never";
  const attemptedCount = Object.keys(answers).length;

  // whether inputs should be disabled (submitting or not fullscreen/paused)
  const inputsDisabled = isSubmittingRef.current || !isFullscreen || paused;

  return (
    <DisableNavContext.Provider value={testStarted}>
      <div className="min-h-screen w-full flex flex-col bg-white">
        {autoSubmitMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 max-w-md w-full text-center">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">{autoSubmitMessage}</h2>
              <p className="text-gray-700 mb-4">Please wait while your answers are submitted.</p>
            </div>
          </div>
        )}
        {/* Top Bar */}
        <div className="w-full bg-white flex items-center justify-between px-10 py-3 shadow-sm sticky top-0 z-10 border-b">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-8" />
            <span className="font-bold text-lg text-black">{test?.title || "Maxx Assessment"}</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-700 font-medium">Saved: {savedLabel}</span>
          </div>
          <div className="flex items-center gap-8">
            <span className="text-gray-700 font-medium">
              Remaining Time: <span className="font-bold">{formatTime(timeLeft)}</span>
            </span>
            <span className="text-gray-700 font-bold">{user?.name}</span>
            <button
              className="bg-blue-600 text-white font-bold px-5 py-2 rounded shadow hover:bg-blue-700 transition-all"
              onClick={() => handleSubmitTest(false)}
              disabled={isSubmittingRef.current}
            >
              Finish Test
            </button>
          </div>
        </div>

        {/* Fullscreen required overlay */}
        {!isFullscreen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex flex-col items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 max-w-md w-full text-center">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Test Locked</h2>
              <p className="text-gray-700 mb-4">You must be in fullscreen mode to take the test.</p>
              <Button
                onClick={async () => {
                  try {
                    if (document.documentElement.requestFullscreen) {
                      await document.documentElement.requestFullscreen();
                    } else if (document.documentElement.webkitRequestFullscreen) {
                      document.documentElement.webkitRequestFullscreen();
                    }
                  } catch {}
                }}
                variant="primary"
              >
                Enter Fullscreen
              </Button>
            </div>
          </div>
        )}

        {/* Navigation & Attempted Count */}
        <div className="w-full max-w-5xl mx-auto flex flex-col px-8 py-4">
          {test?.allowNavigation === false && (
            <div className="mb-2 p-3 bg-yellow-100 text-yellow-900 rounded text-center font-semibold border border-yellow-300">
              Navigation for this exam is restricted. Please contact your mentor or admin if you need help.
            </div>
          )}
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg text-black">Questions</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto" style={{ width: "80%" }}>
            <button
              className="bg-gray-100 border border-gray-300 rounded px-3 py-2 text-lg"
              onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
              disabled={currentQuestionIndex === 0 || test?.allowNavigation === false}
            >
              <i className="fas fa-chevron-left"></i>
            </button>

            {test.questions.map((q, idx) => {
              const k = getQuestionKey(q, idx);
              const isCurrent = idx === currentQuestionIndex;
              const isMarked = !!markForReview[k];
              return (
                <button
                  key={k}
                  className={`font-bold px-4 py-2 rounded border mx-1 text-lg ${
                    isCurrent
                      ? "bg-blue-100 text-blue-700 border-blue-400"
                      : isMarked
                      ? "bg-yellow-100 text-yellow-800 border-yellow-400"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                  onClick={() => (test?.allowNavigation === false ? null : handleGoToQuestion(idx))}
                  style={{ minWidth: "40px" }}
                  aria-current={isCurrent ? "true" : undefined}
                  disabled={test?.allowNavigation === false || isSubmittingRef.current}
                >
                  {idx + 1}
                </button>
              );
            })}

            <button
              className="bg-gray-100 border border-gray-300 rounded px-3 py-2 text-lg"
              onClick={() =>
                setCurrentQuestionIndex((i) =>
                  Math.min(test.questions.length - 1, i + 1)
                )
              }
              disabled={
                currentQuestionIndex === test.questions.length - 1 ||
                test?.allowNavigation === false ||
                isSubmittingRef.current
              }
            >
              <i className="fas fa-chevron-right"></i>
            </button>
            <span className="text-gray-500 ml-4">
              Attempted: {attemptedCount}/{test.questions.length}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-2">
          <div
            className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-0 rounded-lg shadow-lg border border-gray-200 bg-white"
            style={{ minHeight: "500px" }}
          >
            {/* Left: Question */}
            <div className="flex flex-col justify-between p-10">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#153A6B] font-semibold">Question {currentQuestionIndex + 1}</span>
                  <span className="text-gray-500 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="revisitLater"
                      checked={!!markForReview[key]}
                      onChange={() => handleMarkForReview()}
                      className="accent-blue-600"
                      disabled={isSubmittingRef.current}
                    />
                    <label htmlFor="revisitLater" className="cursor-pointer">
                      <i className="fas fa-flag"></i> Revisit Later
                    </label>
                  </span>
                </div>
                <div className="text-gray-800 text-base mb-6">
                  {question?.question || question?.text || "Question not available"}
                </div>
                {/* optionally show images, code blocks, etc. Add here if your question object contains them */}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block border-l border-gray-200"></div>

            {/* Right: Options */}
            <div className="flex flex-col justify-between p-10">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#153A6B] font-semibold">Select an option</span>
                  <button
                    className="text-sm text-[#153A6B] hover:underline"
                    onClick={handleClearResponse}
                    disabled={isSubmittingRef.current}
                  >
                    Clear Response
                  </button>
                </div>
                <div className="flex flex-col gap-4 mb-8">
                  {question?.options?.map((opt, i) => (
                    <label
                      key={i}
                      className={`w-full flex items-center gap-2 border rounded-lg px-4 py-3 transition-all duration-150 cursor-pointer ${
                        answers[key] === i
                          ? "border-[#153A6B] bg-[#F5F8FB]"
                          : "border-gray-300 bg-white hover:border-[#153A6B] hover:bg-[#F5F8FB]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`option-${currentQuestionIndex}`}
                        value={i}
                        checked={answers[key] === i}
                        onChange={() => handleAnswer(currentQuestionIndex, i)}
                        className="accent-blue-600"
                        disabled={inputsDisabled}
                      />
                      <span className="text-base leading-relaxed">{opt}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-gray-500">
                    {isSubmittingRef.current ? "Submitting..." : `${attemptedCount} attempted`}
                  </div>
                  <div>
                    <button
                      className="bg-gray-300 text-gray-800 px-4 py-2 rounded mr-3"
                      onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                      disabled={currentQuestionIndex === 0 || isSubmittingRef.current}
                    >
                      Previous
                    </button>
                    <button
                      className="bg-blue-600 text-white px-5 py-2 rounded shadow hover:bg-blue-700 transition-all text-base font-semibold"
                      style={{ minWidth: "120px" }}
                      onClick={() => {
                        if (currentQuestionIndex < test.questions.length - 1)
                          setCurrentQuestionIndex((i) => i + 1);
                        else handleSubmitTest(false);
                      }}
                      disabled={inputsDisabled}
                    >
                      {currentQuestionIndex < test.questions.length - 1 ? "Next" : "Submit"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full max-w-5xl mx-auto mt-4 mb-2 text-xs text-gray-500 text-center flex flex-col gap-1">
          <div>Maxx Assessment © 2021-2031</div>
          <div className="flex items-center justify-center gap-2">
            <span>Need Help? Contact us:</span>
            <span className="text-black">+1 (800) 265-6038</span>
            <span className="text-black">+91 80471-89190</span>
          </div>
          <div>
            Powered by <span className="font-bold text-black">Maxx</span>
          </div>
        </div>
      </div>
    </DisableNavContext.Provider>
  );
};

export default StartTest;
