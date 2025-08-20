// frontend/src/pages/CourseDetailPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ReactPlayer from 'react-player';
import QuizComponent from '../components/QuizComponent';
import ReactMarkdown from 'react-markdown';

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
  const [notesStatus, setNotesStatus] = useState('');
  const [showNotes, setShowNotes] = useState(false); // NEW STATE

  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [shownQuizzes, setShownQuizzes] = useState(new Set());

  const playerRef = useRef(null);

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

  // Handle video change
  const handleVideoSelect = (video) => {
    const isFullUrl = video.video_file.startsWith('http://') || video.video_file.startsWith('https://');
    const fullUrl = isFullUrl ? video.video_file : `${API_BASE_URL}${video.video_file}`;
    setCurrentVideoUrl(fullUrl);
    setCurrentVideoId(video.id);
    setShowQuiz(false);
    setShownQuizzes(new Set());
    // Reset all status messages
    setTranscriptionStatus('');
    setSmartContentStatus('');
    setNotesStatus('');
    setShowNotes(false); // RESET NOTES DISPLAY
  };

  // Video progress listener
  const handleProgress = ({ playedSeconds }) => {
    if (showQuiz || !playerRef.current || !currentVideoId || !course) return;

    const currentVideo = course.videos.find(v => v.id === currentVideoId);
    const quizzes = currentVideo?.quizzes || [];

    for (const quiz of quizzes) {
      const quizTime = quiz.segment_end_time;
      
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
      // After generation, refetch course details to get the new data
      // fetchCourseDetails(); // NOTE: You'll need to turn fetchCourseDetails into a callable function for this to work
    } catch (error) {
      setSmartContentStatus('Smart content generation failed!');
      console.error('Error during smart content generation:', error);
    }
  };

  // NEW HANDLER FOR NOTES GENERATION
  const handleGenerateNotes = async (videoId) => {
    setNotesStatus('Generating notes...');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/videos/${videoId}/generate-notes/`);
      setNotesStatus(response.data.status);
      // After generation, refetch course details to get the new data
      // fetchCourseDetails();
    } catch (error) {
      setNotesStatus('Notes generation failed!');
      console.error('Error during notes generation:', error);
    }
  };

  // Handle Notes Display
  const handleNotesDisplay = () => {
    setShowNotes(prev => !prev);
  }

  if (loading) return <div>Loading course details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!course) return <div>Course not found.</div>;

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>{course.title}</h1>
      <p>{course.description}</p>

      {showQuiz && currentQuiz && (
        <QuizComponent
          quizData={currentQuiz}
          onQuizPass={onQuizPass}
        />
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

      <div style={{width: '80%', display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
        <h2>Course Videos</h2>
        <button
          onClick={handleNotesDisplay}
          style={{ backgroundColor: '#007BFF', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}
        >
          {showNotes ? 'Hide Notes' : 'Display Notes'}
        </button>
      </div>
      
      {showNotes && course.videos.find(v => v.id === currentVideoId)?.notes && (
        <div style={{ width: '80%', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h3>Notes for this video:</h3>
          <ReactMarkdown>{course.videos.find(v => v.id === currentVideoId)?.notes}</ReactMarkdown>
        </div>
      )}

      <div style={{ width: '80%', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
        {course.videos.length > 0 ? (
          <ul>
            {course.videos.map(video => (
              <li key={video.id} style={{ marginBottom: '10px' }}>
                <span
                  style={{ cursor: 'pointer', color: currentVideoUrl.includes(video.video_file) ? 'blue' : 'black' }}
                  onClick={() => handleVideoSelect(video)}
                >
                  {video.title}
                </span>
                <button
                  onClick={() => handleTranscribe(video.id)}
                  style={{ marginLeft: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Transcribe
                </button>
                {transcriptionStatus && video.id === currentVideoId && (
                  <span style={{ marginLeft: '10px' }}>{transcriptionStatus}</span>
                )}
                <button
                  onClick={() => handleGenerateSmartContent(video.id)}
                  style={{ marginLeft: '10px', backgroundColor: '#800080', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Generate Smart Content
                </button>
                {smartContentStatus && video.id === currentVideoId && (
                  <span style={{ marginLeft: '10px' }}>{smartContentStatus}</span>
                )}
                <button
                  onClick={() => handleGenerateNotes(video.id)}
                  style={{ marginLeft: '10px', backgroundColor: '#ffa500', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Generate Notes
                </button>
                {notesStatus && video.id === currentVideoId && (
                  <span style={{ marginLeft: '10px' }}>{notesStatus}</span>
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