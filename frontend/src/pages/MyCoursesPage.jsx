import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const MyCoursesPage = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/courses/my_courses/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setCourses(res.data);
    } catch (err) {
      console.error("Error fetching my courses:", err);
      setError("Failed to fetch your enrolled courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || role !== "student") {
        alert("Please log in as a student to view your enrolled courses.");
        window.location.href = "/login";
        return;
      }

      try {
        // ✅ Correct API call (your backend has my_courses action)
        const res = await axios.get(`${API_BASE_URL}/api/courses/my-courses/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setCourses(res.data);
      } catch (err) {
        console.error("Failed to fetch enrolled courses:", err);
        setCourses([]); // Reset to avoid endless loading
      } finally {
        setLoading(false); // ✅ Always reset loading
      }
    };

    fetchEnrolledCourses();
  }, []);



  if (loading)
    return (
      <div className="text-center py-16 text-gray-600 dark:text-gray-300">
        Loading your courses...
      </div>
    );

  if (error)
    return (
      <div className="text-center py-16 text-red-600 dark:text-red-400">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2f7] dark:from-[#0f0f0f] dark:to-[#1a1a1a] px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-8 text-center">
          🎓 My Learning
        </h1>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-20">
            You haven’t enrolled in any courses yet.
            <br />
            <Link
              to="/courses"
              className="text-indigo-600 hover:underline font-semibold"
            >
              Browse Available Courses →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const progress = Math.round(course.progress_percentage || 0);

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {course.description?.slice(0, 120) || "No description provided."}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-sky-500 h-2 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <Link
                      to={`/courses/${course.id}`}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold transition"
                    >
                      Resume →
                    </Link>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        course.is_published
                          ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
                          : "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200"
                      }`}
                    >
                      {course.is_published ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MyCoursesPage;
