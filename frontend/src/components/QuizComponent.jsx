import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function QuizComponent({ quizData, quizId, onQuizSubmitted }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  // Track cumulative results
  const [cumulativeCorrect, setCumulativeCorrect] = useState(0);
  const [cumulativeAttempts, setCumulativeAttempts] = useState(0);

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return <p>No quiz data available for this segment.</p>;
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  
  // Safely parse the JSON choices string into a usable array
  const safeChoices = React.useMemo(() => {
    try {
      const parsed = JSON.parse(currentQuestion.choices);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return Array.isArray(currentQuestion.choices)
        ? currentQuestion.choices
        : [];
    }
  }, [currentQuestion]);

  const handleAnswerSelect = (choice) => {
    setSelectedAnswer(choice);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: choice,
    }));
  };

  const handleNext = async () => {
    if (!selectedAnswer) {
      // Using console.error/log instead of alert for better UX flow
      console.log("Please select an answer to proceed.");
      return;
    }

    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Submit answers for this quiz
      const submissionData = {
        answers: Object.keys(answers).map((questionId) => ({
          question_id: questionId,
          selected_option: answers[questionId],
        })),
      };

      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
          `${API_BASE_URL}/api/quizzes/${quizData.id}/submit/`,
          submissionData,
          { headers: { Authorization: `Token ${token}` } }
        );

        // Extract data from the successful response
        const isPassed = response.data.passed;
        const allQuizzesPassed = response.data.all_quizzes_passed; // <-- NEW: Capture final video status
        const correctThisQuiz = response.data.score; 
        const totalThisQuiz = response.data.total_questions; 
        
        // Update cumulative score for the UI result box
        setCumulativeCorrect((prev) => prev + correctThisQuiz);
        setCumulativeAttempts((prev) => prev + totalThisQuiz);
        
        const finalScore = cumulativeCorrect + correctThisQuiz;
        const finalTotal = cumulativeAttempts + totalThisQuiz;

        setQuizResult({
          passed: isPassed,
          score: finalScore,
          total_questions: finalTotal,
        });
        
        // Pass both the immediate result AND the video completion status to the parent
        onQuizSubmitted(isPassed, allQuizzesPassed); // <-- UPDATED ARGUMENTS

      } catch (error) {
        console.error("Error submitting quiz:", error.response || error);
        // Alert user of the network/server error
        onQuizSubmitted(false, false); 
      }
    }
  };

  return (
    <div style={quizContainerStyle}>
      {quizResult ? (
        <div style={quizResultBoxStyle}>
          <h3>Quiz Results</h3>
          <p>
            Your score: {quizResult.score} / {quizResult.total_questions}
          </p>
          <p>{quizResult.passed ? "✅ You passed!" : "❌ You failed."}</p>
          <button
            onClick={() => onQuizSubmitted(quizResult.passed)} 
            style={{ ...submitButtonStyle }}
          >
            Continue
          </button>
        </div>
      ) : (
        <div>
          <h3>Quiz Time!</h3>
          <h4>{currentQuestion.question_text || "Untitled Question"}</h4>
          {safeChoices.length > 0 ? (
            <div className="quiz-choices" style={choicesContainerStyle}>
              {safeChoices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(choice)}
                  style={{
                    ...choiceButtonStyle,
                    backgroundColor:
                      selectedAnswer === choice ? "#007BFF" : "#E9ECEF",
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <p className="quiz-no-choices">No choices provided.</p>
          )}
          {selectedAnswer && (
            <button
              onClick={handleNext}
              style={{ ...submitButtonStyle, backgroundColor: "#28A745" }}
            >
              {currentQuestionIndex < quizData.questions.length - 1
                ? "Next Question"
                : "Submit Quiz"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
// Styles
const quizContainerStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  zIndex: 100,
  textAlign: "center",
  color: "#343A40",
};
const quizResultBoxStyle = {
  backgroundColor: "#fff",
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "20px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  textAlign: "center",
};
const choicesContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  marginTop: "15px",
};
const choiceButtonStyle = {
  padding: "10px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  color: "black",
};
const submitButtonStyle = {
  padding: "10px 20px",
  marginTop: "20px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  color: "white",
  fontWeight: "bold",
};