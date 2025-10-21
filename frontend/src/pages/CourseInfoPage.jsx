import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

const API_BASE_URL = "http://127.0.0.1:8000";

function CourseInfoPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      try {
        // ✅ Step 1: Fetch course info
        const res = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/`, {
          headers: token ? { Authorization: `Token ${token}` } : {},
        });
        setCourse(res.data);

        // ✅ Step 2: If student, check enrollment
        if (token && role === "student") {
          try {
            const enrolledRes = await axios.get(
              `${API_BASE_URL}/api/courses/my-courses/`,
              { headers: { Authorization: `Token ${token}` } }
            );

            const enrolled = enrolledRes.data.some(
              (c) => parseInt(c.id) === parseInt(courseId)
            );
            setIsEnrolled(enrolled);
          } catch (err) {
            console.warn("⚠️ Could not check enrollment:", err);
            setIsEnrolled(false);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch course info:", error);
        setLoading(false);
        if (error.response && error.response.status === 403) {
          alert("You are not authorized to view this course.");
        }
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleEnroll = async () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || !role) {
      navigate("/register");
      return;
    }

    if (role === "student") {
      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/courses/${courseId}/enroll/`,
          {},
          { headers: { Authorization: `Token ${token}` } }
        );

        if (res.status === 201 || res.status === 200) {
          navigate(`/enrolled/${encodeURIComponent(course.title)}`);
        }
      } catch (error) {
        console.error("Enrollment failed:", error);
        alert("Something went wrong while enrolling. Please try again.");
      }
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-lg">
        Loading course details...
      </div>
    );

  if (!course)
    return (
      <div className="p-8 text-center text-gray-500">Course not found.</div>
    );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-indigo-400 via-sky-300 to-cyan-300 opacity-40 blur-[160px] rounded-full top-1/4 left-1/2 transform -translate-x-1/2 animate-pulse"></div>
      </div>

      <motion.div
        className="max-w-4xl mx-auto bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl rounded-2xl p-8 space-y-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Title Section */}
        <motion.h1
          className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent text-center"
          whileHover={{ scale: 1.02 }}
        >
          {course.title}
        </motion.h1>

        <motion.p
          className="text-gray-700 dark:text-gray-300 text-center max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {course.description}
        </motion.p>

        {/* Course Information Section */}
        <div className="grid sm:grid-cols-2 gap-6 mt-8">
          <motion.div
            className="p-5 bg-indigo-50 dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300"
            whileHover={{ scale: 1.05 }}
          >
            <h2 className="text-lg font-semibold text-indigo-600">
              What you'll learn
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mt-2">
              {course.about || "Details coming soon..."}
            </p>
          </motion.div>

          <motion.div
            className="p-5 bg-sky-50 dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300"
            whileHover={{ scale: 1.05 }}
          >
            <h2 className="text-lg font-semibold text-sky-600">
              Skills you'll gain
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mt-2">
              {course.skills_gained || "No skills listed yet."}
            </p>
          </motion.div>

          <motion.div
            className="p-5 bg-cyan-50 dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 sm:col-span-2"
            whileHover={{ scale: 1.05 }}
          >
            <h2 className="text-lg font-semibold text-cyan-600">
              Course Outcome
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mt-2">
              {course.outcome || "No outcome provided yet."}
            </p>
          </motion.div>
        </div>

        {/* Enroll Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          {!isEnrolled ? (
            <motion.button
              onClick={handleEnroll}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              Enroll for Free
            </motion.button>
          ) : (
            <>
              <motion.button
                disabled
                className="px-8 py-3 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed"
              >
                Already Enrolled
              </motion.button>
              <motion.button
                onClick={() => navigate(`/courses/${courseId}`)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-semibold rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                Go to Course
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default CourseInfoPage;
