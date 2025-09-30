import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import QuizComponent from '../components/QuizComponent';
import ReactMarkdown from 'react-markdown';
import CodeEditor from '../components/CodeEditor';

const API_BASE_URL = 'http://127.0.0.1:8000';

function CourseDetailPage({ user }) {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [smartContentStatus, setSmartContentStatus] = useState('');
  const [notesStatus, setNotesStatus] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [shownQuizzes, setShownQuizzes] = useState(new Set());
  const playerRef = useRef(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: token ? { Authorization: `Token ${token}` } : {},
        };
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/`, config);
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
        console.error("Error fetching course details:", err.response || err);
      }
    };
    fetchCourseDetails();
  }, [courseId, user]);

  const handleVideoSelect = (video) => {
    const isFullUrl = video.video_file.startsWith('http://') || video.video_file.startsWith('https://');
    const fullUrl = isFullUrl ? video.video_file : `${API_BASE_URL}${video.video_file}`;
    setCurrentVideoUrl(fullUrl);
    setCurrentVideoId(video.id);
    setShowQuiz(false);
    setShownQuizzes(new Set());
    setTranscriptionStatus('');
    setSmartContentStatus('');
    setNotesStatus('');
    setShowNotes(false);
    setVideoCompleted(false);
    if (playerRef.current) {
        playerRef.current.load();
        playerRef.current.play();
    }
  };

  // Video progress listener
  const handleProgress = (e) => {
    const playedSeconds = e.target.currentTime;
    const duration = e.target.duration;
    
    if (showQuiz || !playerRef.current || !currentVideoId || !course) return;

    const currentVideo = course.videos.find(v => v.id === currentVideoId);
    const quizzes = currentVideo?.quizzes || [];

    if (duration > 0 && playedSeconds / duration >= 0.99) {
        setVideoCompleted(true);
    } else {
        setVideoCompleted(false);
    }

    for (const quiz of quizzes) {
        const quizTime = parseFloat(quiz.segment_end_time); // The FIX: Ensure quizTime is a number
        
        if (!shownQuizzes.has(quiz.id) && playedSeconds >= quizTime) {
            playerRef.current.pause();
            setCurrentQuiz(quiz);
            setShowQuiz(true);
            setShownQuizzes(prev => new Set(prev).add(quiz.id));
            return;
        }
    }
};

const handleQuizSubmitted = (passed) => {
    console.log("Quiz submitted. Passed status:", passed); // Add this line
    setShowQuiz(false);
    setCurrentQuiz(null);
    if (passed) {
        alert("Quiz passed! You can now continue watching.");
        if (playerRef.current) {
            playerRef.current.play();
        }
    } else {
        alert("Quiz failed. Please try again after re-watching the video.");
        const currentVideo = course.videos.find(v => v.id === currentVideoId);
        if (currentVideo && playerRef.current) {
            const segment = currentVideo.segments ? currentVideo.segments.find(s => s.index === currentQuiz.segment_index) : null;
            if (playerRef.current) {
                playerRef.current.currentTime = 0; // Rewind to the beginning
                playerRef.current.play();
            }
        }
        setShownQuizzes(prev => {
            const newSet = new Set(prev);
            newSet.delete(currentQuiz.id);
            return newSet;
        });
    }
};


  const handleTranscribe = async (videoId) => {
    setTranscriptionStatus('Transcription started...');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/videos/${videoId}/transcribe/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      setTranscriptionStatus(response.data.status);
    } catch (error) {
      setTranscriptionStatus('Transcription failed!');
      console.error('Error during transcription:', error.response || error);
    }
  };

  const handleGenerateSmartContent = async (videoId) => {
    setSmartContentStatus('Generating smart content...');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/videos/${videoId}/generate-smart-content/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      setSmartContentStatus(response.data.status);
    } catch (error) {
      setSmartContentStatus('Smart content generation failed!');
      console.error('Error during smart content generation:', error.response || error);
    }
  };
  
  const handleGenerateNotes = async (videoId) => {
    setNotesStatus('Generating notes...');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/videos/${videoId}/generate-notes/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      setNotesStatus(response.data.status);
    } catch (error) {
      setNotesStatus('Notes generation failed!');
      console.error('Error during notes generation:', error.response || error);
    }
  };

  if (loading) return <div>Loading course details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!course) return <div>Course not found.</div>;

return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '80%' }}>
        <h1>{course.title}</h1>
        {user?.role === 'tutor' && (
          <Link
            to={`/upload-video?courseId=${courseId}`}
            style={{
              padding: '10px 15px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px'
            }}
          >
            ⬆️ Upload a Video
          </Link>
        )}
      </div>
      <p style={{ width: '80%' }}>{course.description}</p>
      <div style={{ width: '80%', marginBottom: '20px', position: 'relative' }}>
        {showQuiz && currentQuiz && (
          <QuizComponent
            quizData={currentQuiz}
            quizId={currentQuiz.id}
            onQuizSubmitted={handleQuizSubmitted}
          />
        )}
        {currentVideoUrl ? (
          <video
            ref={playerRef}
            src={currentVideoUrl}
            controls={!showQuiz}
            width="100%"
            onTimeUpdate={handleProgress}
          />
        ) : (
          <div>No video selected or available for this course.</div>
        )}
      </div>
      
      {/* Notes Sidebar and Notes Display Button */}
      <div style={{ width: '80%', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Course Videos</h2>
        <button
            onClick={() => setShowNotes(prev => !prev)}
            style={{ backgroundColor: '#007BFF', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}
            // The 'Display Notes' button is only disabled for students who haven't finished the video
            disabled={user?.role === 'student' && !videoCompleted}
        >
            {showNotes ? 'Hide Notes' : 'Display Notes'}
        </button>
      </div>

      {showNotes && course.videos.find(v => v.id === currentVideoId)?.notes && (
          <div style={{ width: '80%', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>Notes for this video:</h3>
            <ReactMarkdown>{course.videos.find(v => v.id === currentVideoId)?.notes}</ReactMarkdown>
          </div>
      )}

      {/* List of videos and content generation buttons */}
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
                
                {/* Tutor-only buttons for content generation */}
                {user?.role === 'tutor' && (
                  <>
                    <button
                      onClick={() => handleTranscribe(video.id)}
                      style={{ marginLeft: '10px' }}>
                      Transcribe
                    </button>
                    {transcriptionStatus && currentVideoId === video.id && (
                      <span style={{ marginLeft: '10px' }}>{transcriptionStatus}</span>
                    )}
                    <button
                      onClick={() => handleGenerateSmartContent(video.id)}
                      style={{ marginLeft: '10px' }}>
                      Generate Quizzes
                    </button>
                    {smartContentStatus && currentVideoId === video.id && (
                      <span style={{ marginLeft: '10px' }}>{smartContentStatus}</span>
                    )}
                    <button
                      onClick={() => handleGenerateNotes(video.id)}
                      style={{ marginLeft: '10px' }}>
                      Generate Notes
                    </button>
                    {notesStatus && currentVideoId === video.id && (
                      <span style={{ marginLeft: '10px' }}>{notesStatus}</span>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No videos uploaded for this course yet.</p>
        )}
      </div>
      <div style={{ width: '80%', marginTop: '30px' }}>
             {/* Only show the editor if a user is logged in */}
            {user && <CodeEditor />} 
      </div>
    </div>
  );
}

export default CourseDetailPage;