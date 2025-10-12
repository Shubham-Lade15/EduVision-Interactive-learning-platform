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
    const [reportedCompletion, setReportedCompletion] = useState(false);
    const [prevTime, setPrevTime] = useState(0);

    // --- Utility functions ---
    const getProgress = (video) => {
        return video.current_user_progress || { video_completed: false, all_quizzes_passed: false };
    };

    const calculateCourseProgress = (course) => {
        if (!course || !course.videos || course.videos.length === 0) return 0;
        let total = course.videos.length * 2;
        let earned = 0;
        course.videos.forEach(v => {
            const p = getProgress(v);
            if (p.video_completed) earned += 1;
            if (p.all_quizzes_passed) earned += 1;
        });
        return total > 0 ? Math.round((earned / total) * 100) : 0;
    };

    // --- Fetch course + progress data ---
    const fetchCourseDetails = async (videoIdToInit = null) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: token ? { Authorization: `Token ${token}` } : {} };
            const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/`, config);
            setCourse(response.data);

            const videos = response.data.videos || [];
            let targetVideo = videos.find(v => v.id === videoIdToInit);
            
            // If fetching for the first time, load the first video
            if (!targetVideo && videos.length > 0) targetVideo = videos[0];

            if (targetVideo) {
                const fullUrl = targetVideo.video_file.startsWith('http')
                    ? targetVideo.video_file
                    : `${API_BASE_URL}${targetVideo.video_file}`;
                
                // Only change URL if it's different or null (initial load)
                if (currentVideoUrl === '' || targetVideo.id !== currentVideoId) {
                    setCurrentVideoUrl(fullUrl);
                }

                setCurrentVideoId(targetVideo.id);
                const progress = getProgress(targetVideo);
                setVideoCompleted(progress.video_completed);
                setReportedCompletion(progress.video_completed);
            }
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch course details.');
            setLoading(false);
            console.error('Error fetching course:', err);
        }
    };

    useEffect(() => {
        fetchCourseDetails();
    }, [courseId, user]);

    // --- Report completion to backend ---
    const reportVideoCompletion = async (videoId) => {
        if (!user || user.role !== 'student' || reportedCompletion) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/api/videos/${videoId}/record-progress/`,
                { completed: true },
                { headers: { Authorization: `Token ${token}` } }
            );
            setReportedCompletion(true);
            await fetchCourseDetails(videoId);
        } catch (err) {
            console.error('Error reporting video completion:', err);
        }
    };

    const handleVideoSelect = (video) => {
        // --- NEW LOCKING CHECK ---
        if (user?.role === 'student' && course && course.videos) {
            const videoIndex = course.videos.findIndex(v => v.id === video.id);
            // Lock all videos except the first one (index > 0)
            if (videoIndex > 0) {
                const prevVideo = course.videos[videoIndex - 1];
                const prevProgress = getProgress(prevVideo);
                
                // If previous video is NOT complete (must be watched AND quizzes passed)
                if (!prevProgress.video_completed || !prevProgress.all_quizzes_passed) {
                    alert("Please watch the previous video entirely and pass all its quizzes before starting this one.");
                    return; // BLOCK navigation
                }
            }
        }
        // --- END LOCKING CHECK ---
        // NOTE: Video locking logic should be implemented here in the next step
        const isFullUrl = video.video_file.startsWith('http://') || video.video_file.startsWith('https://');
        const fullUrl = isFullUrl ? video.video_file : `${API_BASE_URL}${video.video_file}`;
        
        // Force state update for the new video
        setCurrentVideoUrl(fullUrl);
        setCurrentVideoId(video.id);
        setShowQuiz(false);
        setShownQuizzes(new Set());
        setTranscriptionStatus('');
        setSmartContentStatus('');
        setNotesStatus('');
        setShowNotes(false);

        const progress = getProgress(video);
        setVideoCompleted(progress.video_completed);
        setReportedCompletion(progress.video_completed);

        if (playerRef.current) {
            playerRef.current.load();
            playerRef.current.play();
        }
    };

    const handleSeeking = (e) => {
        const video = e.target;
        const seekingTo = video.currentTime;
        if (user?.role === 'student' && seekingTo > prevTime + 1.0) {
            video.currentTime = prevTime;
            console.log('Forward seeking blocked.');
        }
    };

    const handleProgress = (e) => {
        const played = e.target.currentTime;
        const duration = e.target.duration;
        setPrevTime(played);

        if (showQuiz || !playerRef.current || !currentVideoId || !course) return;

        const currentVideo = course.videos.find(v => v.id === currentVideoId);
        const quizzes = currentVideo?.quizzes || [];

        if (duration > 0 && played / duration >= 0.99 && !reportedCompletion) {
            reportVideoCompletion(currentVideoId);
        }

        for (const quiz of quizzes) {
            const quizTime = parseFloat(quiz.segment_end_time);
            if (!shownQuizzes.has(quiz.id) && played >= quizTime) {
                playerRef.current.pause();
                setCurrentQuiz(quiz);
                setShowQuiz(true);
                setShownQuizzes(prev => new Set(prev).add(quiz.id));
                return;
            }
        }
    };

    // FIX: Using 'newAllQuizzesPassed' passed from QuizComponent to sync state
    const handleQuizSubmitted = (passed, newAllQuizzesPassed = false) => {
        console.log("Quiz submitted. Passed status:", passed);
        setShowQuiz(false);
        setCurrentQuiz(null);

        // Helper to update local course state
        const updateCourseState = (allPassed) => {
            setCourse(prevCourse => {
                if (!prevCourse) return prevCourse;
                const updatedVideos = prevCourse.videos.map(v => {
                    if (v.id === currentVideoId) {
                        return {
                            ...v,
                            current_user_progress: {
                                ...getProgress(v),
                                all_quizzes_passed: allPassed
                            }
                        };
                    }
                    return v;
                });
                return { ...prevCourse, videos: updatedVideos };
            });
        };

        // ✅ Only update when final quiz passed (backend ensures correct flag)
        if (newAllQuizzesPassed) {
            updateCourseState(true);
            fetchCourseDetails(currentVideoId); // refresh persisted state
        }

        // --- DO NOT TOUCH THIS LOGIC BELOW ---
        // if (passed) {
        //     alert("Quiz passed! You can now continue watching.");
        //     // We assume successful pass updates the DB and we update the local state here
        //     updateCourseState(true);

        //     if (playerRef.current) {
        //         playerRef.current.play();
        //     }
        if (passed) {
            alert("Quiz passed! Video resuming.");
            
            // Synchronize state after successful quiz completio 

            if (playerRef.current) {
                playerRef.current.play();
            }

            // Mark quiz as seen in the session.
            setShownQuizzes(prev => new Set(prev).add(currentQuiz.id));
        } else {
            alert("Quiz failed. Please try again after re-watching the video segment.");

            // NEW: Smart Rewind Logic - Rewind to the beginning of the video segment.
            // Since we don't have segment start times on the client yet, we rewind to 0 for safety.
            const rewindTime = 0;

            if (playerRef.current) {
                playerRef.current.currentTime = rewindTime;
                playerRef.current.play();
            }

            // Allow the quiz to be shown again
            setShownQuizzes(prev => {
                const newSet = new Set(prev);
                newSet.delete(currentQuiz.id);
                return newSet;
            });
        }
    };

    // --- Tutor content actions ---
    const handleTranscribe = async (videoId) => {
        setTranscriptionStatus('Transcribing...');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/videos/${videoId}/transcribe/`, {}, {
                headers: { Authorization: `Token ${token}` }
            });
            setTranscriptionStatus(res.data.status);
        } catch {
            setTranscriptionStatus('Failed!');
        }
    };

    const handleGenerateSmartContent = async (videoId) => {
        setSmartContentStatus('Generating...');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/videos/${videoId}/generate-smart-content/`, {}, {
                headers: { Authorization: `Token ${token}` }
            });
            setSmartContentStatus(res.data.status);
        } catch {
            setSmartContentStatus('Failed!');
        }
    };

    const handleGenerateNotes = async (videoId) => {
        setNotesStatus('Generating...');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/videos/${videoId}/generate-notes/`, {}, {
                headers: { Authorization: `Token ${token}` }
            });
            setNotesStatus(res.data.status);
        } catch {
            setNotesStatus('Failed!');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!course) return <div>Course not found.</div>;

    const courseProgress = calculateCourseProgress(course);

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

            {user?.role === 'student' && (
                <div style={{ width: '80%', margin: '10px 0' }}>
                    <div style={{ padding: '5px', backgroundColor: '#f0f0f0', textAlign: 'center', fontWeight: 'bold' }}>
                        Course Progress: {courseProgress}%
                    </div>
                    <div style={{ height: '10px', backgroundColor: '#e9ecef' }}>
                        <div style={{ width: `${courseProgress}%`, height: '100%', backgroundColor: '#28a745', transition: 'width 0.5s' }} />
                    </div>
                </div>
            )}

            <p style={{ width: '80%' }}>{course.description}</p>

            <div style={{ width: '80%', marginBottom: '20px' }}>
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
                        onSeeking={handleSeeking}
                    />
                ) : (
                    <div>No video selected.</div>
                )}
            </div>

            <div style={{ width: '80%', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Course Videos</h2>
                <button
                    onClick={() => setShowNotes(prev => !prev)}
                    style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}
                    disabled={user?.role === 'student' && !videoCompleted}
                >
                    {showNotes ? 'Hide Notes' : 'Display Notes'}
                </button>
            </div>

            {showNotes && course.videos.find(v => v.id === currentVideoId)?.notes && (
                <div style={{ width: '80%', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h3>Notes:</h3>
                    <ReactMarkdown>{course.videos.find(v => v.id === currentVideoId)?.notes}</ReactMarkdown>
                </div>
            )}

            <div style={{ width: '80%', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
                <ul>
                    {course.videos.map((video, index) => {
                        // NEW: Determine if this video is locked
                        const isLocked = user?.role === 'student' && index > 0 && 
                                         (!getProgress(course.videos[index - 1]).video_completed || 
                                          !getProgress(course.videos[index - 1]).all_quizzes_passed);
                        
                        return (
                            <li key={video.id} style={{ marginBottom: '10px' }}>
                                <span
                                    style={{ 
                                            cursor: isLocked ? 'not-allowed' : 'pointer', 
                                            color: isLocked ? '#999' : (currentVideoId === video.id ? 'blue' : 'black') 
                                        }}
                                    onClick={() => !isLocked && handleVideoSelect(video)}
                                >
                                    {isLocked ? '🔒 ' : ''}{video.title}
                                    {getProgress(video).video_completed && (
                                        <span style={{ marginLeft: '10px', color: 'green' }}>[Watched ✅]</span>
                                    )}
                                    {getProgress(video).all_quizzes_passed && (
                                        <span style={{ marginLeft: '10px', color: 'darkgreen' }}>[Quizzes Passed ⭐]</span>
                                    )}
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
                        );
                    })}
                </ul>
            </div>

            <div style={{ width: '80%', marginTop: '30px' }}>
                <CodeEditor />
            </div>
        </div>
    );
}

export default CourseDetailPage;