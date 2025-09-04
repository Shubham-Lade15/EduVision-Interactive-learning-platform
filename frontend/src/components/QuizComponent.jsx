import React, { useState } from "react";
import axios from 'axios';

// Update props to include quizId and a submission handler
export default function QuizComponent({ quizData, quizId, onQuizSubmitted }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [quizStatus, setQuizStatus] = useState(null); // 'pass', 'fail', or null

    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        return <p>No quiz data available for this segment.</p>;
    }

    const currentQuestion = quizData.questions[currentQuestionIndex];
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

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setShowFeedback(false);
        } else {
            alert("Quiz finished! Awaiting backend submission...");
            // Logic to submit the quiz will go here
        }
    };
    
    // NEW: Handle the final quiz submission to the backend
    const handleSubmit = async () => {
        // Collect all answers
        const allAnswers = quizData.questions.map((q, index) => ({
            question_id: q.id,
            selected_option: selectedAnswer // This is a simplification; a full implementation would store all answers
        }));

        const submissionData = {
            answers: allAnswers
        };
        
        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/quizzes/${quizId}/submit/`,
                submissionData,
            );
            
            // Check the response from the backend
            if (response.data.passed) {
                setQuizStatus('pass');
                onQuizSubmitted(true); // Call the parent handler
            } else {
                setQuizStatus('fail');
                alert("You did not pass the quiz. Please re-watch the video and try again.");
                onQuizSubmitted(false); // Call the parent handler
            }

        } catch (error) {
            console.error("Error submitting quiz:", error.response || error);
            alert("Quiz submission failed. Please try again.");
            onQuizSubmitted(false);
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
                            style={{
                                ...choiceButtonStyle,
                                backgroundColor: selectedAnswer === choice ? '#007BFF' : '#E9ECEF'
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
                    onClick={handleSubmit} // Use the new handleSubmit
                    style={{
                        ...submitButtonStyle,
                        backgroundColor: '#28A745'
                    }}
                >
                    Submit
                </button>
            )}
        </div>
    );
}

// Basic CSS styles for the component (from your original code)
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