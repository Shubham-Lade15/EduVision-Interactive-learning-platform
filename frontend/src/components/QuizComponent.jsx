import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const API_BASE_URL = "http://127.0.0.1:8000";

const normalize = (s = "") =>
  String(s)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const extractKeyFromChoice = (choice) => {
  const m = String(choice).trim().match(/^\s*([A-Za-z])\s*[).:-]/);
  return m ? m[1].toUpperCase() : "";
};

const parseChoices = (rawChoices) => {
  if (!rawChoices) return [];
  if (Array.isArray(rawChoices)) return rawChoices.map((c) => String(c));
  if (typeof rawChoices === "string") {
    try {
      const parsed = JSON.parse(rawChoices);
      if (Array.isArray(parsed)) return parsed.map((c) => String(c));
    } catch {}
    // fallback: split lines
    return rawChoices.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const QuizComponent = ({ quizData, quizId, onQuizSubmitted }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [choices, setChoices] = useState([]);
  const [questionText, setQuestionText] = useState("");
  // Try to locate a server-provided correct answer if present
  const [serverCorrectAnswer, setServerCorrectAnswer] = useState(null);

  useEffect(() => {
    setSelectedIndex(null);
    setSubmitting(false);
    setFeedback("");

    if (!quizData) {
      setQuestionText("");
      setChoices([]);
      setServerCorrectAnswer(null);
      return;
    }

    // Normalize many backend shapes
    let qText = "";
    let rawChoices = [];
    let cAnswer = null;

    // shape: quizData.questions[0].*
    if (Array.isArray(quizData.questions) && quizData.questions.length > 0) {
      const q0 = quizData.questions[0];
      qText = q0.question_text || q0.question || q0.prompt || "";
      rawChoices = q0.choices || q0.choices_text || q0.choices_json || [];
      cAnswer = q0.correct_answer || q0.answer || q0.correct || null;
    } else {
      // direct fields
      qText = quizData.question_text || quizData.question || quizData.title || quizData.prompt || "";
      rawChoices = quizData.choices || quizData.choices_list || quizData.choices_json || quizData.options || [];
      cAnswer = quizData.correct_answer || quizData.answer || null;
    }

    const parsed = parseChoices(rawChoices);
    setChoices(parsed);
    setQuestionText(qText || "Question not available.");
    setServerCorrectAnswer(cAnswer ? String(cAnswer) : null);
  }, [quizData]);

  if (!quizData) {
    return (
      <div className="p-6 text-center">
        <div className="text-lg font-semibold">No quiz data available.</div>
      </div>
    );
  }

  const handleLocalCorrectCheck = (selectedTxt) => {
    // If server provided the correct answer, try to match locally to avoid false negatives
    if (!serverCorrectAnswer) return null; // unknown
    const normServer = normalize(serverCorrectAnswer);
    const normSelected = normalize(selectedTxt);

    // direct match
    if (normServer === normSelected) return true;

    // maybe server stored letter key "A" - compare keys
    const serverKey = String(serverCorrectAnswer).trim().toUpperCase();
    if (serverKey.length === 1 && serverKey.match(/[A-Z]/)) {
      // map choices to keys (A,B,C...)
      const chosenKey = extractKeyFromChoice(selectedTxt);
      if (chosenKey && chosenKey === serverKey) return true;
    }

    // maybe server stored full choice with letter prefix "A) Choice text", try to normalize
    // check each choice normalized vs server normalized
    for (const ch of choices) {
      if (normalize(ch) === normServer && normalize(ch) === normSelected) return true;
    }

    return false;
  };

  const handleSubmit = async () => {
    if (selectedIndex === null) {
      setFeedback("⚠️ Please select an option.");
      return;
    }
    setSubmitting(true);
    setFeedback("");

    const selectedText = String(choices[selectedIndex] || "").trim();
    const currentQuestion = quizData.questions[0];

    // Prepare payload in the format expected by the backend `submit_quiz` action
    const payload = {
      answers: [{
        question_id: currentQuestion.id,
        // CRITICAL: Send the full choice text. The backend will use `is_answer_correct` to validate this.
        selected_option_text: selectedText, 
      }],
    };

    // Skip local check to rely entirely on the backend for final result consistency

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/quizzes/${quizId}/submit/`,
        payload,
        { headers: token ? { Authorization: `Token ${token}` } : {} }
      );

      const passed = res.data?.passed ?? false;
      // Capture the critical status flag updated by the backend (Feature 2)
      const newAllQuizzesPassed = res.data?.all_quizzes_passed ?? false; 

      if (passed) {
        setFeedback("✅ Correct — resuming video...");
      } else {
        // Feature 4: Wrong option means restart/re-appear
        setFeedback("❌ Incorrect — video restarting for review."); 
      }

      // Delay resume slightly to allow user to read feedback
      setTimeout(() => {
        // Pass result and new video status back to CourseDetailPage
        onQuizSubmitted(passed, newAllQuizzesPassed, quizId);
        setSubmitting(false);
      }, 700);
    } catch (err) {
      console.error("Error submitting quiz:", err.response || err);
      const serverMsg = err?.response?.data?.error || "Submission failed. Try again.";
      setFeedback(`⚠️ ${serverMsg}`);
      setSubmitting(false);
      // On failure, treat as failed quiz submission for the parent component (restart video)
      onQuizSubmitted(false, false, quizId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <motion.div
        initial={{ y: -10, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 w-full max-w-3xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6"
      >
        <h2 className="text-center text-2xl font-bold text-indigo-600 mb-4">Interactive Quiz</h2>

        <div className="mb-4 text-lg text-center text-gray-800 dark:text-gray-200">
          {questionText}
        </div>

        <div className="space-y-3 mb-6">
          {choices.length > 0 ? (
            choices.map((choice, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`cursor-pointer p-3 rounded-lg border transition select-none ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                  }`}
                >
                  {choice}
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500">No options available.</div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedIndex === null}
            className={`px-6 py-2 rounded-md font-semibold text-white ${
              submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600"
            }`}
          >
            {submitting ? "Submitting..." : "Submit Answer"}
          </button>

          {feedback && (
            <div className="mt-4 text-center font-medium">
              <span
                className={
                  feedback.startsWith("✅")
                    ? "text-green-600"
                    : feedback.startsWith("❌")
                    ? "text-red-600"
                    : "text-yellow-600"
                }
              >
                {feedback}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default QuizComponent;
