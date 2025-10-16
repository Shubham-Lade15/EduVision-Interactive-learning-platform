import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import QuizComponent from '../components/QuizComponent';
import ReactMarkdown from 'react-markdown';
import CodeEditor from '../components/CodeEditor';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Mock component for Syllabus Accordion (for illustration)
const SyllabusAccordion = ({ videos, currentVideoId, handleVideoSelect, isLockedCheck, user }) => {
    return (
        <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4">Course Curriculum</h3>
            <div className="border border-gray-200 rounded-lg">
                {videos.map((video, index) => {
                    const progress = video.current_user_progress || {};
                    const isCurrent = video.id === currentVideoId;
                    const isLocked = isLockedCheck(video, index);

                    return (
                        <div 
                            key={video.id} 
                            className={`p-4 border-b last:border-b-0 ${isCurrent ? 'bg-indigo-50 font-semibold' : 'hover:bg-gray-50'} ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            onClick={() => !isLocked && handleVideoSelect(video)}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-base text-gray-800">
                                    {isLocked ? '🔒 ' : `${index + 1}. `}
                                    {video.title}
                                </span>
                                <div className="text-sm space-x-3">
                                    {progress.video_completed && (
                                        <span className="text-green-600">Watched ✅</span>
                                    )}
                                    {progress.all_quizzes_passed && (
                                        <span className="text-green-700">Passed ⭐</span>
                                    )}
                                    {isCurrent && <span className="text-indigo-600 font-bold">▶️ Playing</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


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
    
    // NEW UTILITY: Locking check logic
    const isLockedCheck = (video, index) => {
        if (!user || user.role !== 'student' || index === 0) return false;
        
        const prevVideo = course.videos[index - 1];
        const prevProgress = getProgress(prevVideo);
        
        return !prevProgress.video_completed || !prevProgress.all_quizzes_passed;
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
            
            if (!targetVideo && videos.length > 0) targetVideo = videos[0];

            if (targetVideo) {
                const fullUrl = targetVideo.video_file.startsWith('http')
                    ? targetVideo.video_file
                    : `${API_BASE_URL}${targetVideo.video_file}`;
                
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
        // --- VIDEO LOCKING CHECK ---
        if (user?.role === 'student' && course && course.videos) {
            const videoIndex = course.videos.findIndex(v => v.id === video.id);
            if (videoIndex > 0) {
                if (isLockedCheck(video, videoIndex)) {
                    alert("Please watch the previous video entirely and pass all its quizzes before starting this one.");
                    return; // BLOCK navigation
                }
            }
        }
        // --- END LOCKING CHECK ---
        
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

    const handleQuizSubmitted = async (passed, newAllQuizzesPassed = false) => {
        console.log("Quiz submitted. Passed status:", passed);
        setShowQuiz(false);
        setCurrentQuiz(null);

        if (passed) {
            alert("Quiz passed! Video resuming.");
            
            

            if (playerRef.current) {
                playerRef.current.play();
            }

            setShownQuizzes(prev => new Set(prev).add(currentQuiz.id));

        } else {
            alert("Quiz failed. Please try again after re-watching the segment.");

            const rewindTime = 0; 
            if (playerRef.current) {
                playerRef.current.currentTime = rewindTime;
                playerRef.current.play();
            }

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

    // --- Component for Enrollment CTA (for unauthenticated or unenrolled users) ---
    const EnrollmentCTA = () => (
        <div className="md:w-1/4 p-6 bg-white rounded-xl shadow-lg border border-gray-200 sticky top-6">
            <h4 className="text-3xl font-extrabold text-indigo-600 mb-4">FREE</h4>
            <p className="text-sm text-gray-500 mb-4">Enroll now to gain instant, lifetime access to all videos, quizzes, and the integrated code editor.</p>
            
            <button className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-indigo-700 transition duration-200">
                Enroll Now
            </button>

            <div className="mt-4 pt-3 border-t text-sm text-gray-600">
                <p className="flex justify-between items-center mb-1">
                    <span>📚 Lectures:</span> <span>{course.videos.length}</span>
                </p>
                <p className="flex justify-between items-center mb-1">
                    <span>⏱️ Duration:</span> <span>{course.duration_hours} Hours</span>
                </p>
                <p className="flex justify-between items-center">
                    <span>🌐 Language:</span> <span>{course.language}</span>
                </p>
            </div>
        </div>
    );
    
    // --- Component for Course Player/Syllabus View (for enrolled users) ---
    const CoursePlayerView = () => (
        <div className="flex flex-col md:flex-row max-w-7xl mx-auto gap-8 mt-6">
            {/* Main Content Area (Video, Quiz, Code Editor) */}
            <div className="md:w-3/4">
                {/* Video Player Section */}
                <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden relative">
                    {showQuiz && currentQuiz && (
                        // QuizComponent is positioned absolutely over the video
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
                    <div className="p-10 text-white text-center">Select a video from the syllabus.</div>
                )}
                </div>
                
                {/* Video Tabs (Notes / Code Editor / Discussions) */}
                <div className="bg-white p-6 mt-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Smart Content & Code Editor</h3>
                        <button
                            onClick={() => setShowNotes(prev => !prev)}
                            className="bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-600 transition"
                            disabled={user?.role === 'student' && !videoCompleted}
                        >
                            {showNotes ? 'Hide Notes' : 'Display Notes'}
                        </button>
                    </div>

                    {showNotes && course.videos.find(v => v.id === currentVideoId)?.notes && (
                        <div className="mb-8 p-4 bg-gray-50 border border-gray-100 rounded-lg max-h-96 overflow-y-auto">
                            <ReactMarkdown>{course.videos.find(v => v.id === currentVideoId)?.notes}</ReactMarkdown>
                        </div>
                    )}

                    {/* Code Editor */}
                    <CodeEditor />
                    
                    {/* Tutor Content Generation Tools */}
                    {user?.role === 'tutor' && (
                        <div className="mt-8 pt-4 border-t border-gray-200">
                            <h4 className="text-lg font-semibold mb-3">Tutor Tools: Content Generation</h4>
                            <div className="space-x-3">
                                {/* Trancribe Button Logic */}
                                <button onClick={() => handleTranscribe(currentVideoId)} className="bg-yellow-500 text-white py-2 px-3 text-sm rounded hover:bg-yellow-600">Transcribe</button>
                                {transcriptionStatus && currentVideoId === currentVideoId && <span className="ml-2 text-sm text-gray-600">{transcriptionStatus}</span>}
                                
                                {/* Generate Quizzes Button Logic */}
                                <button onClick={() => handleGenerateSmartContent(currentVideoId)} className="bg-purple-500 text-white py-2 px-3 text-sm rounded hover:bg-purple-600">Generate Quizzes</button>
                                {smartContentStatus && currentVideoId === currentVideoId && <span className="ml-2 text-sm text-gray-600">{smartContentStatus}</span>}
                                
                                {/* Generate Notes Button Logic */}
                                <button onClick={() => handleGenerateNotes(currentVideoId)} className="bg-pink-500 text-white py-2 px-3 text-sm rounded hover:bg-pink-600">Generate Notes</button>
                                {notesStatus && currentVideoId === currentVideoId && <span className="ml-2 text-sm text-gray-600">{notesStatus}</span>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Right Sidebar (Syllabus/Curriculum) */}
            <div className="md:w-1/4">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-6">
                    <h3 className="text-xl font-bold mb-4">Course Progress: {calculateCourseProgress(course)}%</h3>
                    <div className="h-2 bg-gray-200 rounded-full mb-6">
                        <div 
                            style={{ width: `${calculateCourseProgress(course)}%` }} 
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        />
                    </div>

                    <SyllabusAccordion 
                        videos={course.videos} 
                        currentVideoId={currentVideoId}
                        handleVideoSelect={handleVideoSelect}
                        isLockedCheck={isLockedCheck}
                        user={user}
                    />
                </div>
            </div>
        </div>
    );

    // --- Main Course Details View (for non-enrolled users) ---
    const CourseDetailsMain = () => (
        <div className="max-w-6xl mx-auto py-12 px-6">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-2/3">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-3">{course.title}</h1>
                    <p className="text-xl text-gray-600 mb-6">{course.short_description}</p>
                    
                    {/* Metadata */}
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-8">
                        <span>⭐ 5.0 (No Reviews Yet)</span> 
                        <span>⏱️ {course.duration_hours} Hours</span>
                        <span>🌐 {course.language}</span>
                    </div>

                    {/* Full Description / What You'll Learn */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold border-b pb-2">Course Overview</h3>
                        <ReactMarkdown className="text-gray-700 leading-relaxed">{course.description}</ReactMarkdown>
                        
                        <h3 className="text-2xl font-bold border-b pb-2 pt-4">Syllabus</h3>
                        <SyllabusAccordion 
                            videos={course.videos} 
                            currentVideoId={null} 
                            handleVideoSelect={handleVideoSelect}
                            isLockedCheck={(v, i) => true} // Lock all in public view
                            user={user}
                        />
                    </div>
                </div>

                {/* Enrollment Box (CTA) */}
                <EnrollmentCTA />
            </div>
            
            {/* Reviews and Related Courses (Placeholders) */}
            <div className="mt-12 border-t pt-8">
                <h3 className="text-2xl font-bold mb-4">Student Reviews</h3>
                <p className="text-gray-600">Reviews section will be displayed here using Feature 2.2 API data.</p>
            </div>
        </div>
    );


    // --- Main Render Decision ---
    
    // We assume here that if the user is authenticated and is NOT a tutor, 
    // they should be able to access the course player (auto-enrolled or free course).
    // In a final project, you would check for an active Enrollment record here.
    const isEnrolledOrTutor = user?.role === 'tutor' || user?.role === 'student'; 

    return (
        <div className="min-h-screen bg-gray-50">
            {isEnrolledOrTutor ? <CoursePlayerView /> : <CourseDetailsMain />}
        </div>
    );
}

export default CourseDetailPage;