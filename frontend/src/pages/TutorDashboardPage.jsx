import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

const TutorDashboardPage = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTutorCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/courses/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const tutorCourses = res.data.filter(
        (course) => course.tutor === user?.id || user?.role === "tutor"
      );
      setCourses(tutorCourses);
    } catch (err) {
      console.error(err);
      setError("Failed to load your courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorCourses();
  }, []);

  const handlePublishToggle = async (courseId, isPublished) => {
    const token = localStorage.getItem("token");
    try {
      // ✅ Use tutor-specific endpoints
      const endpoint = isPublished
        ? `${API_BASE_URL}/api/tutor/courses/${courseId}/unpublish/`
        : `${API_BASE_URL}/api/tutor/courses/${courseId}/publish/`;

      const res = await axios.post(
        endpoint,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );

      // ✅ Real-time state update without reload
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? { ...course, is_published: !isPublished }
            : course
        )
      );

      // ✅ Optional user feedback
      if (!isPublished) {
        alert("✅ Course published successfully! It’s now visible to students and guests.");
      } else {
        alert("🛑 Course unpublished. It’s now hidden from students and guests.");
      }
    } catch (error) {
      console.error("Publish toggle failed:", error);
      alert("⚠️ Failed to update publish status. Please try again.");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this course? This action cannot be undone."
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_BASE_URL}/api/courses/${courseId}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      // Remove the deleted course from state instantly
      setCourses((prevCourses) =>
        prevCourses.filter((c) => c.id !== courseId)
      );

      alert("✅ Course deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting course:", error);
      alert("Failed to delete the course. Please try again.");
    }
  };

  if (!user || user.role !== "tutor") {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-center p-6">
        <h1 className="text-2xl font-semibold text-red-600">
          You can’t access this page.
        </h1>
        <p className="text-gray-600 mt-2">
          Only tutors have permission to view this dashboard.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-lg">
        Loading dashboard data...
      </div>
    );
  }

  if (error)
    return (
      <div className="text-center text-red-600 py-10 dark:text-red-400">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2f7] dark:from-[#0f0f0f] dark:to-[#1a1a1a] p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto space-y-10"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400">
            Tutor Dashboard
          </h1>
          <Link
            to="/create-course"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow transition"
          >
            ➕ Create New Course
          </Link>
        </div>

        {/* OVERVIEW CARDS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-5 border border-gray-200 dark:border-gray-800">
            <h3 className="text-gray-500 text-sm">Total Courses</h3>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {courses.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-5 border border-gray-200 dark:border-gray-800">
            <h3 className="text-gray-500 text-sm">Published</h3>
            <p className="text-3xl font-bold text-green-500">
              {courses.filter((c) => c.is_published).length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-5 border border-gray-200 dark:border-gray-800">
            <h3 className="text-gray-500 text-sm">Unpublished</h3>
            <p className="text-3xl font-bold text-red-500">
              {courses.filter((c) => !c.is_published).length}
            </p>
          </div>
        </div>

        {/* COURSE MANAGEMENT TABLE */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 overflow-x-auto">
          <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
            Manage Your Courses
          </h2>

          {courses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              You haven’t created any courses yet.
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <td className="py-3 px-4 font-medium">{course.title}</td>
                    <td className="py-3 px-4">{course.language}</td>
                    <td className="py-3 px-4">{course.duration_hours} hrs</td>
                    <td className="py-3 px-4">
                      {course.is_published ? (
                        <span className="text-green-600 font-semibold">
                          Published
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold">
                          Unpublished
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center space-x-3">
                      <Link
                        to={`/courses/${course.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handlePublishToggle(course.id, course.is_published)}
                        className={`px-3 py-1 rounded-md text-white text-sm font-medium transition ${
                          course.is_published
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {course.is_published ? "Unpublish" : "Publish"}
                      </button>

                       {/* 🗑️ DELETE COURSE BUTTON */}
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium transition"
                      >
                        Delete
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TutorDashboardPage;
