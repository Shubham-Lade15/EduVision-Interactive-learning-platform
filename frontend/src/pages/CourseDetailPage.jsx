import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import QuizComponent from "../components/QuizComponent";
import ReactMarkdown from "react-markdown";
import CodeEditor from "../components/CodeEditor";

const API_BASE_URL = "http://127.0.0.1:8000";

function CourseDetailPage({ user }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [shownQuizzes, setShownQuizzes] = useState(new Set());
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [transcriptionStatus, setTranscriptionStatus] = useState("");
  const [smartContentStatus, setSmartContentStatus] = useState("");
  const [notesStatus, setNotesStatus] = useState("");
  
  const playerRef = useRef(null);
  const [prevTime, setPrevTime] = useState(0);

  // --- Utility functions ---
  /**
   * Extracts the student progress object, defaulting to an empty/initial state.
   */
  const getProgress = (video) => {
    // Feature 6: Retrieves persistent progress from the backend.
    return video?.current_user_progress || { 
      video_completed: false, 
      all_quizzes_passed: false, 
      last_watched_time: 0.0 
    };
  };

  /**
 * Helper to update the progress fields within the local 'course' state object.
 * @param {number} videoId The ID of the video to update.
 * @param {object} updates The progress fields to update (e.g., { all_quizzes_passed: true }).
 */
  const updateCourseVideoProgress = (videoId, updates) => {
      setCourse(prevCourse => {
          if (!prevCourse) return prevCourse;
          
          const updatedVideos = prevCourse.videos.map(v => {
              if (v.id === videoId) {
                  const currentProgress = getProgress(v);
                  return {
                      ...v,
                      current_user_progress: { 
                          ...currentProgress, 
                          ...updates 
                      },
                      // Also merge the passed_quiz_ids if needed
                      passed_quiz_ids: updates.all_quizzes_passed 
                          ? v.quizzes.map(q => q.id) 
                          : v.passed_quiz_ids 
                  };
              }
              return v;
          });

          return { ...prevCourse, videos: updatedVideos };
      });
  };

  /**
   * Calculates course completion percentage (Feature 1).
   * Each video completion (watched + quizzes passed) counts as one step.
   */
  const calculateCourseProgress = (course) => {
    if (!course || !course.videos || course.videos.length === 0) return 0;

    let totalPoints = 0;
    let earnedPoints = 0;

    course.videos.forEach(v => {
      // Each video offers 2 points: 1 for watching, 1 for quizzes passed.
      totalPoints += 2;
      const p = getProgress(v);

      if (p.video_completed) earnedPoints += 1;
      // Feature 2: Only updates progress bar if all quizzes are passed.
      if (p.all_quizzes_passed) earnedPoints += 1; 
    });

    return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  };

  // ---------------- Fetch course details (Called on mount or refresh) ----------------
  const fetchCourseDetails = async (videoIdToInit = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/`, {
        headers: token ? { Authorization: `Token ${token}` } : {},
      });

      setCourse(res.data);
      const videos = res.data.videos || [];
      let targetVideo = videos.find(v => v.id === videoIdToInit);

      // If fetching for the first time, load the first video
      if (!targetVideo && videos.length > 0 && !currentVideoId) targetVideo = videos[0];

      if (targetVideo) {
          handleVideoInitialization(targetVideo);
      }

      setLoading(false);
    } catch (err) {
      const errorMessage = err?.response?.data?.error || "Failed to fetch course details. Are you enrolled?";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleVideoInitialization = (video) => {
    const fullUrl = video.video_file.startsWith("http")
      ? video.video_file
      : `${API_BASE_URL}${video.video_file}`;

    setCurrentVideoUrl(fullUrl);
    setCurrentVideoId(video.id);
    setShowNotes(false);
    setShowQuiz(false);
    
    // Feature 4: Load passed quizzes from the backend on video select/init
    const backendPassed = new Set(video.passed_quiz_ids || []);
    setShownQuizzes(backendPassed); 
  }

  useEffect(() => {
    fetchCourseDetails(); 
  }, [courseId, user]);

  // --- Feature 6: Report progress and save last watched time ---
  const saveProgress = async (videoId, isCompleted = false, currentTime) => {
    if (!user || user.role !== 'student' || !videoId || !course) return;

    const currentVideo = course.videos.find(v => v.id === videoId);
    const progress = getProgress(currentVideo);
    
    if (isCompleted && progress.video_completed) isCompleted = false;

    // Throttle non-completion saves to avoid spamming the API (e.g., every 5 seconds)
    const lastSavedTime = progress.last_watched_time || 0;
    const shouldSaveTime = currentTime >= lastSavedTime + 5.0 || isCompleted;

    if (!isCompleted && !shouldSaveTime) return;

    try {
        const token = localStorage.getItem('token');
        const payload = {
            completed: isCompleted,
            last_watched_time: currentTime 
        };

        const res = await axios.post(
            `${API_BASE_URL}/api/videos/${videoId}/record-progress/`,
            payload,
            { headers: { Authorization: `Token ${token}` } }
        );
        
        // Update local state (course) using the fresh progress data from the response
        setCourse(prevCourse => {
            if (!prevCourse) return prevCourse;
            const updatedVideos = prevCourse.videos.map(v => {
                if (v.id === videoId) {
                    return {
                        ...v,
                        current_user_progress: res.data.progress 
                    };
                }
                return v;
            });
            return { ...prevCourse, videos: updatedVideos };
        });

    } catch (err) {
        console.error('Error reporting video progress:', err.response || err);
    }
  };

  // ---------------- Video Handlers ----------------
  const handleVideoSelect = (video) => {
    // Feature 3: Sequential Video Locking
    if (user?.role === 'student' && course && course.videos) {
      const videoIndex = course.videos.findIndex(v => v.id === video.id);
      
      if (videoIndex > 0) {
        const prevVideo = course.videos[videoIndex - 1];
        const prevProgress = getProgress(prevVideo);

        // Lock if previous video is NOT completely watched AND all quizzes passed.
        if (!prevProgress.video_completed || !prevProgress.all_quizzes_passed) {
          alert(" 🔒  Please watch the previous video entirely AND pass all its quizzes before starting this one.");
          return; // BLOCK navigation
        }
      }
    }

    handleVideoInitialization(video);
    // Setting currentTime here will trigger load/play/pause depending on browser
    if (playerRef.current) {
        const initialTime = getProgress(video)?.last_watched_time || 0;
        playerRef.current.currentTime = initialTime;
    }
  };


  const handleProgress = (e) => {
    const played = e.target.currentTime;
    const duration = e.target.duration;
    
    // Feature 6: Save Last Watched Time
    if (currentVideoId && user?.role === 'student') {
        saveProgress(currentVideoId, false, played);
    }

    // Feature 2: Check for Video Completion
    const isCompleted = duration > 0 && played / duration >= 0.99;
    if (isCompleted && currentVideoId && user?.role === 'student') {
        const currentVideo = course.videos.find((v) => v.id === currentVideoId);
        const progress = getProgress(currentVideo);
        if (!progress.video_completed) {
          saveProgress(currentVideoId, true, duration);
          // Manually trigger a full refresh to update the parent video's status, 
          // which unlocks the next video via re-render.
          updateCourseVideoProgress(currentVideoId, { video_completed: true });
          // fetchCourseDetails(currentVideoId); 
        }
    }

    setPrevTime(played);

    if (showQuiz || !playerRef.current || !currentVideoId || !course) return;

    // Feature 4: Check for Quiz Triggers
    const currentVideo = course.videos.find((v) => v.id === currentVideoId);
    const quizzes = currentVideo?.quizzes || [];

    for (const quiz of quizzes) {
      const quizTime = parseFloat(quiz.segment_end_time);
      
      // Check if quiz time is reached AND quiz hasn't been passed (Feature 4)
      const isPassedOrShown = shownQuizzes.has(quiz.id);

      if (!isPassedOrShown && played >= quizTime) {
        playerRef.current.pause();
        setCurrentQuiz(quiz);
        setShowQuiz(true);
        return;
      }
    }
  };


  const handleSeeking = (e) => {
    // Prevent skipping forward (students only)
    const video = e.target;
    const seekingTo = video.currentTime;
    // Tutors/Admins can seek. Students can only seek backwards or slightly forwards (1.5s tolerance).
    if (user?.role === "student" && seekingTo > prevTime + 1.5) {
      video.currentTime = prevTime;
      console.warn("Forward seeking blocked for students.");
    }
  };

  const handleLoadedData = () => {
    if (playerRef.current && currentVideoId) {
        const currentVideo = course.videos.find(v => v.id === currentVideoId);
        const progress = getProgress(currentVideo);
        // Feature 6: Resume from last watched time
        if (progress.last_watched_time > 0) {
            playerRef.current.currentTime = progress.last_watched_time;
        }
    }
  }
  
  // --- Feature 4: Handle Quiz Submission from QuizComponent ---
  const handleQuizSubmitted = (passed, newAllQuizzesPassed = false, quizId) => {
    setShowQuiz(false); // Hide the quiz component

    if (passed) {
        // Mark quiz as passed locally in the session
        setShownQuizzes((prev) => new Set(prev).add(quizId));
        
        if (newAllQuizzesPassed) {
             // If all quizzes for the video are now passed, refresh everything 
             // to update the progress bar and unlock the next video.
             updateCourseVideoProgress(currentVideoId, { all_quizzes_passed: true });
            //  fetchCourseDetails(currentVideoId); 
        }

        if (playerRef.current) {
            playerRef.current.play();
        }
    } else {
        // Feature 4: Quiz failed. Rewind logic.
        alert("Quiz failed 😔. Video restarting for review. Please try again.");
        if (playerRef.current) {
            // Rewind to 0 to force student re-watch
            playerRef.current.currentTime = 0; 
            playerRef.current.play();
        }
        // Note: The quiz will reappear once the video reaches the segment end time again.
    }
    setCurrentQuiz(null);
  };

  // ---------------- Tutor Tools ----------------
  const handleTranscribe = async (videoId) => {
    setTranscriptionStatus("Transcribing...");
    // ... (logic remains the same)
  };
  const handleGenerateSmartContent = async (videoId) => {
    setSmartContentStatus("Generating...");
    // ... (logic remains the same)
  };
  const handleGenerateNotes = async (videoId) => {
    setNotesStatus("Generating...");
    // ... (logic remains the same)
  };
  const toggleEditor = () => setEditorOpen((p) => !p);
  const toggleSidebar = () => setSidebarOpen((p) => !p);

  // ---------------- UI & Rendering ----------------
  if (loading)
    return <div className="p-8 text-center text-lg font-semibold">Loading...</div>;
  if (error)
    return <div className="p-8 text-center text-red-600 font-semibold">{error}</div>;
  if (!course)
    return <div className="p-8 text-center text-gray-700">Course not found.</div>;

  const courseProgress = calculateCourseProgress(course);
  const currentVideo = course.videos.find((v) => v.id === currentVideoId);
  const currentVideoProgress = currentVideo ? getProgress(currentVideo) : null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto flex gap-4 p-4">
        {/* ===== Sidebar (Course Content) ===== */}
        <aside
          className={`transition-all duration-300 bg-white dark:bg-gray-900 rounded-xl shadow p-4 ${
            sidebarOpen ? "w-64" : "w-14"
          }`}
        >
          {/* Sidebar Toggle */}
          <div className="flex justify-between items-center mb-3">
            {sidebarOpen && (
              <h2 className="text-lg font-bold text-indigo-600">{course.title}</h2>
            )}
            <button
              onClick={toggleSidebar}
              className="text-sm p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {sidebarOpen ? " ◀ " : " ▶ "}
            </button>
          </div>

          {sidebarOpen && (
            <>
              {/* --- Course Progress Bar (Feature 1, 2) --- */}
              {user?.role === 'student' && (
                <div className="mb-4 pt-1">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Course Mastery ({courseProgress}%)</h3>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all duration-500"
                      style={{ width: `${courseProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Tutor Upload Video Button */}
              {user?.role === "tutor" && (
                <button
                  onClick={() => navigate(`/upload-video?courseId=${courseId}`)}
                  className="w-full mb-4 px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-all duration-300"
                >
                  ⬆️ Upload New Video
                </button>
              )}

              {/* --- Video List --- */}
              <h3 className="text-sm font-semibold mb-2">Videos</h3>
              <ul className="space-y-2">
                {course.videos.map((video, index) => {
                  // Feature 3: Determine if this video is locked based on the previous video's status
                  const isLocked = user?.role === 'student' && index > 0 &&
                    (!getProgress(course.videos[index - 1]).video_completed ||
                    !getProgress(course.videos[index - 1]).all_quizzes_passed);

                  const isCurrent = video.id === currentVideoId;
                  const progress = getProgress(video);
                  
                  return (
                    <li
                      key={video.id}
                      onClick={() => !isLocked && handleVideoSelect(video)}
                      className={`p-2 rounded-md transition ${
                        isCurrent
                          ? "bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200"
                          : isLocked 
                            ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-600" 
                            : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {isLocked ? " 🔒 " : " ▶ "} {video.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {progress.video_completed && (<span>[Watched ✅]</span>)}
                        {progress.all_quizzes_passed && (<span>[Quizzes ⭐]</span>)}
                      </div>
                    </li>
                  );
                })}
              </ul>
              
              {/* Notes Button (Feature 5) */}
              <button
                onClick={() => setShowNotes((p) => !p)}
                // Notes unlock condition: is a tutor OR is a student AND video is completed
                disabled={user?.role === 'student' && !(currentVideoProgress?.video_completed)}
                className={`w-full mt-4 px-3 py-2 rounded-md border text-sm transition ${
                  (user?.role === 'student' && !currentVideoProgress?.video_completed)
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {showNotes
                  ? "Hide Notes"
                  : "Display Notes"}
                {user?.role === "student" && !currentVideoProgress?.video_completed && " (Locked)"}
              </button>
            </>
          )}
        </aside>

        {/* ===== Main Content (Video, Quiz, Editor) ===== */}
        <main className="flex-1 flex flex-col gap-4">
          <div
            className={`grid gap-4 transition-all duration-500 ${
              editorOpen ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* ---- Left (Video / Notes / Quiz) ---- */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
              
              {/* Notes Content */}
              {showNotes ? (
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {(() => {
                      if (!currentVideo) return "No video selected.";
                      
                      const isTutorOrAdmin = user?.role === "tutor" || user?.role === "admin";

                      // Check completion status for notes unlock for students
                      if (user?.role === "student" && !currentVideoProgress?.video_completed) {
                           return "# Notes Locked 🔒\n\nComplete the current video to unlock the study notes.";
                      }

                      if (!currentVideo.notes || currentVideo.notes.trim() === "")
                          return `No notes available yet. ${isTutorOrAdmin ? "(Ready for Tutor generation)" : ""}`;
                                              
                      return currentVideo.notes;
                    })()}
                  </ReactMarkdown>
                </div>
              ) : (
                <>
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
                      controls
                      className="w-full rounded-lg bg-black aspect-video"
                      onTimeUpdate={handleProgress}
                      onSeeking={handleSeeking}
                      onLoadedData={handleLoadedData} // Feature 6: Resume time logic
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Select a video to begin learning.
                    </div>
                  )}
                  {/* ===== Buttons below video (Tutor Tools) ===== */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={toggleEditor}
                      className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      {editorOpen ? "Close Editor" : "Use Code Editor"}
                    </button>
                    {user?.role === "tutor" && currentVideoId && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex flex-col items-start">
                          <button
                            onClick={() => handleTranscribe(currentVideoId)}
                            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Transcribe
                          </button>
                          {transcriptionStatus && (
                            <span className="text-xs text-gray-500 mt-1">
                              {transcriptionStatus}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-start">
                          <button
                            onClick={() =>
                              handleGenerateSmartContent(currentVideoId)
                            }
                            className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            Generate Quizzes
                          </button>
                          {smartContentStatus && (
                            <span className="text-xs text-gray-500 mt-1">
                              {smartContentStatus}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-start">
                          <button
                            onClick={() => handleGenerateNotes(currentVideoId)}
                            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Generate Notes
                          </button>
                          {notesStatus && (
                            <span className="text-xs text-gray-500 mt-1">
                              {notesStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {/* ---- Right (Code Editor) ---- */}
            {editorOpen && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Code Editor</h3>
                <CodeEditor />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CourseDetailPage;
