import React, { useState } from "react";

export default function QuizComponent({ quizData, onQuizPass }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return <p>No quiz data available for this segment.</p>;
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  
  // Normalize choices from JSON string to an array
  const safeChoices = React.useMemo(() => {
    try {
      const parsed = JSON.parse(currentQuestion.choices);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return Array.isArray(currentQuestion.choices) ? currentQuestion.choices : [];
    }
  }, [currentQuestion]);

  const handleAnswerSelect = (choice) => {
    setSelectedAnswer(choice);
  };

  const handleSubmit = () => {
    setShowFeedback(true);
    if (selectedAnswer === currentQuestion.correct_answer) {
      if (currentQuestionIndex < quizData.questions.length - 1) {
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        // Quiz is finished
        onQuizPass();
      }
    } else {
      alert("Incorrect answer. Please try again.");
    }
  };

  return (
    <div className="quiz-container" style={quizContainerStyle}>
      <h3>Quiz Time!</h3>
      <h4>{currentQuestion.question_text || "Untitled Question"}</h4>
      
      {safeChoices.length > 0 ? (
        <div className="quiz-choices" style={choicesContainerStyle}>
          {safeChoices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswerSelect(choice)}
              style={{...choiceButtonStyle, backgroundColor: selectedAnswer === choice ? '#007BFF' : '#E9ECEF'}}
              disabled={showFeedback}
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
          onClick={handleSubmit} 
          style={{...submitButtonStyle, backgroundColor: '#28A745'}}
        >
          Submit
        </button>
      )}
    </div>
  );
}

// Basic CSS styles for the component
const quizContainerStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  zIndex: 100,
  textAlign: 'center',
  color: '#343A40'
};

const choicesContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '15px'
};

const choiceButtonStyle = {
  padding: '10px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  color: 'black'
};

const submitButtonStyle = {
  padding: '10px 20px',
  marginTop: '20px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  color: 'white',
  fontWeight: 'bold'
};