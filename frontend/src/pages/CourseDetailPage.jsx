import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  const [videoCompleted, setVideoCompleted] = useState(false);
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

  // ---------------- Helper functions ----------------
  const getProgress = (video) =>
    video.current_user_progress || { video_completed: false, all_quizzes_passed: false };

  const calculateCourseProgress = (courseObj) => {
    if (!courseObj?.videos?.length) return 0;
    let total = courseObj.videos.length * 2;
    let earned = 0;
    courseObj.videos.forEach((v) => {
      const p = getProgress(v);
      if (p.video_completed) earned += 1;
      if (p.all_quizzes_passed) earned += 1;
    });
    return Math.round((earned / total) * 100);
  };

  const isLockedCheck = (video, index) => {
    if (!user || user.role !== "student" || index === 0) return false;
    const prevVideo = course.videos[index - 1];
    const prevProgress = getProgress(prevVideo);
    return !prevProgress.video_completed || !prevProgress.all_quizzes_passed;
  };

  // ---------------- Fetch course ----------------
  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/`, {
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      setCourse(res.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch course details.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  // ---------------- Video progress reporting ----------------
  const reportVideoCompletion = async (videoId) => {
    if (!user || user.role !== "student") return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/videos/${videoId}/record-progress/`,
        { completed: true },
        { headers: { Authorization: `Token ${token}` } }
      );
      await fetchCourseDetails();
    } catch (err) {
      console.error("Error reporting completion:", err);
    }
  };

  // ---------------- Video handlers ----------------
  const handleVideoSelect = (video) => {
    const fullUrl = video.video_file.startsWith("http")
      ? video.video_file
      : `${API_BASE_URL}${video.video_file}`;
    setCurrentVideoUrl(fullUrl);
    setCurrentVideoId(video.id);
    setShowNotes(false);
    setShowQuiz(false);
    const currentVid = course.videos.find(v => v.id === video.id);
    const backendPassed = new Set(video.passed_quiz_ids || []);
    setShownQuizzes(backendPassed);
    const progress = getProgress(video);
    setVideoCompleted(progress.video_completed);

  };

  const handleProgress = (e) => {
    const played = e.target.currentTime;
    const duration = e.target.duration;
    setPrevTime(played);

    if (!currentVideoId || !course) return;
    const currentVideo = course.videos.find((v) => v.id === currentVideoId);
    const quizzes = currentVideo?.quizzes || [];

    // Mark video completed when fully watched
    if (duration > 0 && played / duration >= 0.99 && !videoCompleted) {
      setVideoCompleted(true);
      reportVideoCompletion(currentVideoId);
    }

    // Show quiz at correct time
    for (const quiz of quizzes) {
      const quizTime = parseFloat(quiz.segment_end_time);
      if (getProgress(currentVideo)?.all_quizzes_passed) return; // ✅ skip quizzes if all passed

      if (!shownQuizzes.has(quiz.id) && played >= quizTime) {
        playerRef.current.pause();
        setCurrentQuiz(quiz);
        setShowQuiz(true);
        return;
      }
    }
  };

  const handleSeeking = (e) => {
    // prevent skipping forward
    const video = e.target;
    const seekingTo = video.currentTime;
    if (user?.role === "student" && seekingTo > prevTime + 1.5) {
      video.currentTime = prevTime;
      console.warn("Forward seeking blocked for students.");
    }
  };

  const handleQuizSubmitted = async (passed, allPassed, quizId, quizResponse = {}) => {
    setShowQuiz(false);

    if (passed) {
      // ✅ Add the quiz to shown quizzes
      setShownQuizzes((prev) => new Set(prev).add(currentQuiz?.id));

      // ✅ If all quizzes for this video are passed, trigger full progress update
      if (newAllQuizzesPassed) {
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `${API_BASE_URL}/api/videos/${currentVideoId}/record-progress/`,
            { completed: true },
            { headers: { Authorization: `Token ${token}` } }
          );
          // Refresh the data → updates progress bar, unlocks next video, unlocks notes
          await fetchCourseDetails();
        } catch (err) {
          console.error("Error updating progress after quiz pass:", err);
        }
      }

      // ✅ Resume video only after progress updated
      if (playerRef.current) playerRef.current.play();
    }
  }



  // ---------------- Tutor Tools ----------------
  const handleTranscribe = async (videoId) => {
    setTranscriptionStatus("Transcribing...");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/videos/${videoId}/transcribe/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setTranscriptionStatus(res.data.status || "Done");
    } catch {
      setTranscriptionStatus("Failed");
    }
  };

  const handleGenerateSmartContent = async (videoId) => {
    setSmartContentStatus("Generating...");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/videos/${videoId}/generate-smart-content/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setSmartContentStatus(res.data.status || "Generated");
      await fetchCourseDetails();
    } catch {
      setSmartContentStatus("Failed to generate quizzes");
    }
  };

  const handleGenerateNotes = async (videoId) => {
    setNotesStatus("Generating...");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/videos/${videoId}/generate-notes/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setNotesStatus(res.data.status || "Notes generated");
      await fetchCourseDetails();
    } catch {
      setNotesStatus("Failed to generate notes");
    }
  };

  const toggleEditor = () => setEditorOpen((p) => !p);
  const toggleSidebar = () => setSidebarOpen((p) => !p);

  // ---------------- UI ----------------
  if (loading)
    return <div className="p-8 text-center text-lg font-semibold">Loading...</div>;
  if (error)
    return <div className="p-8 text-center text-red-600 font-semibold">{error}</div>;
  if (!course)
    return <div className="p-8 text-center text-gray-700">Course not found.</div>;

  const courseProgress = calculateCourseProgress(course);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* ===== Progress Bar ===== */}
      {user?.role === "student" && (
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm px-6 py-3">
          <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-sky-500 transition-all duration-700"
              style={{ width: `${courseProgress}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 mt-1 text-right">
            Progress: {courseProgress}%
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex gap-4 p-4">
        {/* ===== Sidebar ===== */}
        <aside
          className={`transition-all duration-300 bg-white dark:bg-gray-900 rounded-xl shadow p-4 ${
            sidebarOpen ? "w-64" : "w-14"
          }`}
        >
          <div className="flex justify-between items-center mb-3">
            {sidebarOpen && (
              <h2 className="text-lg font-bold text-indigo-600">{course.title}</h2>
            )}
            <button
              onClick={toggleSidebar}
              className="text-sm p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>

          {sidebarOpen && (
            <>
              <h3 className="text-sm font-semibold mb-2">Videos</h3>
              <ul className="space-y-2">
                {course.videos.map((video, idx) => {
                  const locked = isLockedCheck(video, idx);
                  return (
                    <li
                      key={video.id}
                      onClick={() => !locked && handleVideoSelect(video)}
                      className={`p-2 rounded-md cursor-pointer ${
                        locked ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
                      } ${
                        video.id === currentVideoId
                          ? "bg-indigo-100 border border-indigo-200"
                          : ""
                      }`}
                    >
                      <div className="text-sm font-medium">{video.title}</div>
                      <div className="text-xs text-gray-500">
                        {getProgress(video).video_completed ? "✅ Completed" : ""}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={() => setShowNotes((p) => !p)}
                className="w-full mt-4 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 text-sm"
                disabled={user?.role === "student" && !videoCompleted}
              >
                {showNotes
                  ? "Hide Notes"
                  : `Show Notes for ${
                      course.videos.find((v) => v.id === currentVideoId)?.title || "this video"
                    }`}
              </button>
            </>
          )}
        </aside>

        {/* ===== Main Content ===== */}
        <main className="flex-1 flex flex-col gap-4">
          <div
            className={`grid gap-4 transition-all duration-500 ${
              editorOpen ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* ---- Left (Video / Notes / Quiz) ---- */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
              {showNotes ? (
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {course.videos.find((v) => v.id === currentVideoId)?.notes ||
                      "No notes available yet."}
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
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      No video selected
                    </div>
                  )}

                  {/* ===== Buttons below video ===== */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={toggleEditor}
                      className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      {editorOpen ? "Close Editor" : "Use Code Editor"}
                    </button>

                    {user?.role === "tutor" && currentVideoId && (
                      <>
                        <button
                          onClick={() => handleTranscribe(currentVideoId)}
                          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          Transcribe
                        </button>
                        <button
                          onClick={() => handleGenerateSmartContent(currentVideoId)}
                          className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Generate Quizzes
                        </button>
                        <button
                          onClick={() => handleGenerateNotes(currentVideoId)}
                          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          Generate Notes
                        </button>
                      </>
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
