// frontend/src/pages/CourseDetailPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import QuizComponent from '../components/QuizComponent';

const API_BASE_URL = 'http://127.0.0.1:8000';

function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [smartContentStatus, setSmartContentStatus] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [shownQuizzes, setShownQuizzes] = useState(new Set());

  const playerRef = useRef(null);

  // Fetch course details
  // Fetch course details
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/`);
        setCourse(response.data);

        if (response.data.videos && response.data.videos.length > 0) {
          const firstVideo = response.data.videos[0];
          const fullUrl = firstVideo.video_file.startsWith('http')
            ? firstVideo.video_file
            : `${API_BASE_URL}${firstVideo.video_file}`;

          setCurrentVideoUrl(fullUrl);
          setCurrentVideoId(firstVideo.id);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch course details. Please check the backend API.');
        setLoading(false);
        console.error("Error fetching course details:", err);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (showQuiz || !playerRef.current || !currentVideoId || !course) return;

      const currentTime = playerRef.current.currentTime;
      const currentVideo = course.videos.find(v => v.id === currentVideoId);
      const quizzes = currentVideo?.quizzes || [];

      for (const quiz of quizzes) {
        const quizTime = quiz.segment_end_time ?? 0;
        if (!shownQuizzes.has(quiz.id) && currentTime >= quizTime) {
          playerRef.current.pause();
          setCurrentQuiz(quiz);
          setShowQuiz(true);
          setShownQuizzes(prev => new Set(prev).add(quiz.id));
          return;
        }
      }
    }, 200); // 5x per second

    return () => clearInterval(interval);
  }, [course, currentVideoId, showQuiz, shownQuizzes]);

  // Handle video change
  const handleVideoSelect = (video) => {
    const isFullUrl = video.video_file.startsWith('http://') || video.video_file.startsWith('https://');
    const fullUrl = isFullUrl ? video.video_file : `${API_BASE_URL}${video.video_file}`;

    setCurrentVideoUrl(fullUrl);
    setCurrentVideoId(video.id);
    setShowQuiz(false);
    setShownQuizzes(new Set());

    // Reset status messages
    setTranscriptionStatus('');
    setSmartContentStatus('');
  };

  // Video progress listener
  const handleProgress = ({ playedSeconds }) => {
    // Return if quiz is showing, no player, or no current video data
    if (showQuiz || !playerRef.current || !currentVideoId || !course) return;

    const currentVideo = course.videos.find(v => v.id === currentVideoId);
    const quizzes = currentVideo?.quizzes || [];

    for (const quiz of quizzes) {
        // The CRUCIAL FIX: Use the segment_end_time as the trigger
        const quizTime = quiz.segment_end_time;
        
        // This if condition checks if the quiz hasn't been shown AND the video time has passed the trigger point
        if (!shownQuizzes.has(quiz.id) && playedSeconds >= quizTime) {
            console.log(`Triggering quiz at ${quizTime}s for quiz ID: ${quiz.id}`);
            playerRef.current.pause();
            setCurrentQuiz(quiz);
            setShowQuiz(true);
            setShownQuizzes(prev => new Set(prev).add(quiz.id));
            return;
        }
    }
};

  // Resume after passing quiz
  const onQuizPass = () => {
    setShowQuiz(false);
    setCurrentQuiz(null);
    if (playerRef.current) {
      playerRef.current.play();
    }
  };

  // Transcribe
  const handleTranscribe = async (videoId) => {
    setTranscriptionStatus('Transcription started...');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/videos/${videoId}/transcribe/`);
      setTranscriptionStatus(response.data.status);
    } catch (error) {
      setTranscriptionStatus('Transcription failed!');
      console.error('Error during transcription:', error);
    }
  };

  // NEW HANDLER FOR SMART CONTENT GENERATION
  const handleGenerateSmartContent = async (videoId) => {
    setSmartContentStatus('Generating smart content...');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/videos/${videoId}/generate-smart-content/`);
      setSmartContentStatus(response.data.status);
    } catch (error) {
      setSmartContentStatus('Smart content generation failed!');
      console.error('Error during smart content generation:', error);
    }
  };

  if (loading) return <div>Loading course details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!course) return <div>Course not found.</div>;

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>{course.title}</h1>
      <p>{course.description}</p>

      {showQuiz && currentQuiz && (
        <QuizComponent quizData={currentQuiz} onQuizPass={onQuizPass} />
      )}

      <div style={{ width: '80%', marginBottom: '20px', position: 'relative' }}>
        {currentVideoUrl ? (
          <video
            ref={playerRef}
            src={currentVideoUrl}
            controls={!showQuiz}
            width="100%"
            onTimeUpdate={(e) => handleProgress({ playedSeconds: e.target.currentTime })}
          />
        ) : (
          <div>No video selected or available for this course.</div>
        )}
      </div>

      <h2>Course Videos</h2>
      <div style={{ width: '80%', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
        {course.videos.length > 0 ? (
          <ul>
            {course.videos.map(video => (
              <li key={video.id} style={{ marginBottom: '10px' }}>
                <span
                  style={{
                    cursor: 'pointer',
                    color: currentVideoUrl.includes(video.video_file) ? 'blue' : 'black'
                  }}
                  onClick={() => handleVideoSelect(video)}
                >
                  {video.title}
                </span>

                <button
                  onClick={() => handleTranscribe(video.id)}
                  style={{
                    marginLeft: '10px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Transcribe
                </button>
                {transcriptionStatus && video.id === currentVideoId && (
                  <span style={{ marginLeft: '10px' }}>{transcriptionStatus}</span>
                )}

                <button
                  onClick={() => handleGenerateSmartContent(video.id)}
                  style={{
                    marginLeft: '10px',
                    backgroundColor: '#800080',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Generate Smart Content
                </button>
                {smartContentStatus && video.id === currentVideoId && (
                  <span style={{ marginLeft: '10px' }}>{smartContentStatus}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No videos uploaded for this course yet.</p>
        )}
      </div>
    </div>
  );
}

export default CourseDetailPage;
