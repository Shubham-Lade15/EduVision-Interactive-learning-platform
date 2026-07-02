import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const CourseListPage = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const params = new URLSearchParams(location.search);
  const searchTitle = params.get("search_title") || params.get("search") || "";

  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        const searchTitle = params.get("search_title") || params.get("search") || "";
        const token = localStorage.getItem("token");

        // Construct API endpoint with optional search parameter
        const url = searchTitle
          ? `${API_BASE_URL}/api/courses/?search_title=${encodeURIComponent(searchTitle)}`
          : `${API_BASE_URL}/api/courses/`;

        const res = await axios.get(url, {
          headers: token ? { Authorization: `Token ${token}` } : {},
        });

        setCourses(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setError("Unable to fetch courses. Please try again later.");
        setLoading(false);
      }
    };

    fetchCourses();
  }, [location.search]);

  // Handle course view navigation
  const handleViewCourse = (courseId) => {
    // Guests, students, and tutors — all go to CourseInfoPage
    navigate(`/course-info/${courseId}`);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-lg">
        Loading courses...
      </div>
    );

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#eef2f7] to-[#f8fafc] dark:from-[#0f0f0f] dark:via-[#1a1a1a] dark:to-[#0f0f0f] text-gray-900 dark:text-gray-100 transition-colors duration-500">
      {/* ======= HEADER ======= */}
      <section className="text-center py-20 relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="w-[500px] h-[500px] rounded-full blur-[160px] opacity-60 animate-slowGradient mx-auto bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300 dark:from-indigo-700 dark:via-sky-600 dark:to-cyan-500" />
        </div>
        <h1 className="text-4xl font-extrabold mb-4">
          Explore Our{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent">
            Courses
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-gray-700 dark:text-gray-300">
          Learn at your own pace with interactive video lessons, AI-generated notes,
          and real-time coding exercises.
        </p>
      </section>
      {searchTitle && (
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
          Showing results for: <span className="text-indigo-600">“{searchTitle}”</span>
        </h2>
      )}
      {/* ======= COURSE GRID ======= */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        {courses.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400">
            No courses available yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <motion.div
                key={course.id}
                whileHover={{ scale: 1.03 }}
                className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
                    {course.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {course.tutor_name || "Unknown Tutor"}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                    {course.description || "No description available."}
                  </p>
                </div>
                <button
                 onClick={() => handleViewCourse(course.id)}
                 className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-md transition"
                >
                  View Course
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default CourseListPage;
