import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

const VideoUploadForm = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCourse = searchParams.get("courseId");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");

        if (!token || !username) {
          console.warn("No token or username found — user not authenticated.");
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/api/courses/`, {
          headers: { Authorization: `Token ${token}` },
        });

        // ✅ Show only courses created by the logged-in tutor
        const tutorCourses = res.data.filter(
          (course) => course.tutor_username === username
        );

        if (tutorCourses.length === 0) {
          console.warn("No tutor courses found for this account.");
        }

        setCourses(tutorCourses);
      } catch (err) {
        console.error("❌ Failed to fetch tutor courses:", err);
        setCourses([]);
      }
    };

    fetchCourses();

    if (preselectedCourse) {
      setSelectedCourse(preselectedCourse);
    }
  }, [preselectedCourse]);


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setMessage("");
    } else {
      setMessage("❌ Please select a valid video file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('course', selectedCourse);  // ✅ course ID sent here
    formData.append('video_file', videoFile);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: {} };
      if (token) config.headers.Authorization = `Token ${token}`;

      const response = await axios.post(
        `${API_BASE_URL}/api/videos/upload/`,
        formData,
        config
      );
      alert("Video is successfully uploaded!");
      setMessage('Video uploaded successfully!');
      navigate('/courses');
    } catch (error) {
      setMessage('Failed to upload video. Please ensure you are a tutor.');
      console.error('Error uploading video:', error.response || error);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-[#f8fafc] to-[#eef2f7] dark:from-[#0f0f0f] dark:to-[#1a1a1a] px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800"
      >
        <h1 className="text-3xl font-extrabold text-center mb-6 bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
          🎬 Upload a New Video
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Selection */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">-- Select a Course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Video Title */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
              Video Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-400 transition"
              placeholder="e.g. Introduction to Algorithms"
            />
          </div>

          {/* File Upload */}
          <div
            className="border-2 border-dashed border-indigo-400 dark:border-indigo-600 rounded-xl p-6 text-center cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 transition"
            onClick={() => document.getElementById("videoInput").click()}
          >
            <input
              id="videoInput"
              type="file"
              accept="video/*"
              hidden
              onChange={handleFileChange}
            />
            {videoFile ? (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                🎥 Selected:{" "}
                <span className="font-semibold">{videoFile.name}</span>
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Drag & Drop or Click to Upload Video
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 text-white font-semibold rounded-lg shadow-md transition-all duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600"
            }`}
          >
            {loading ? "Uploading..." : "Upload Video"}
          </button>
        </form>

        {/* Message */}
        {message && (
          <p
            className={`mt-4 text-center font-medium ${
              message.includes("✅") ? "text-green-600" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default VideoUploadForm;
