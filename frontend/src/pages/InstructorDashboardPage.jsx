import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const API_BASE_URL = "http://127.0.0.1:8000";

const InstructorDashboardPage = ({ user }) => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalVideos: 0,
    totalStudents: 0,
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInstructorData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/courses/`, {
        headers: { Authorization: `Token ${token}` },
      });

      const tutorCourses = res.data.filter(
        (course) => course.tutor === user?.id || user?.role === "tutor"
      );

      const totalVideos = tutorCourses.reduce(
        (sum, c) => sum + (c.videos?.length || 0),
        0
      );

      // Mock student count (replace with real API later)
      const totalStudents = tutorCourses.length * 25;

      setStats({
        totalCourses: tutorCourses.length,
        totalVideos,
        totalStudents,
      });
      setCourses(tutorCourses);
    } catch (err) {
      console.error("Error fetching instructor data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructorData();
  }, []);

  // --- Mock Data for Charts (replace with backend analytics later)
  const enrollmentData = courses.map((course) => ({
    name: course.title.length > 15 ? course.title.slice(0, 15) + "..." : course.title,
    enrollments: Math.floor(Math.random() * 150) + 20,
  }));

  if (loading)
    return (
      <div className="text-center py-10 text-gray-600 dark:text-gray-300">
        Loading Instructor Dashboard...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2f7] dark:from-[#0f0f0f] dark:to-[#1a1a1a] p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto space-y-10"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400">
            Instructor Dashboard
          </h1>
          <div className="flex gap-3">
            <Link
              to="/create-course"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow transition"
            >
              ➕ Create Course
            </Link>
            <Link
              to="/upload-video"
              className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-lg shadow transition"
            >
              🎬 Upload Video
            </Link>
          </div>
        </div>

        {/* OVERVIEW CARDS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-gray-500 text-sm">Total Courses</h3>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.totalCourses}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-gray-500 text-sm">Total Videos</h3>
            <p className="text-3xl font-bold text-sky-500">{stats.totalVideos}</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-gray-500 text-sm">Active Students</h3>
            <p className="text-3xl font-bold text-green-500">{stats.totalStudents}</p>
          </div>
        </div>

        {/* ENROLLMENT CHART */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">
            Course Enrollments Overview
          </h2>
          {courses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-10">
              No courses available yet to show analytics.
            </p>
          ) : (
            <div className="w-full h-80">
              <ResponsiveContainer>
                <BarChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                    }}
                  />
                  <Bar dataKey="enrollments" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* COURSE TABLE */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 overflow-x-auto">
          <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">
            My Courses Overview
          </h2>

          {courses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              You haven’t created any courses yet.
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
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
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/courses/${course.id}`}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        View Course
                      </Link>
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

export default InstructorDashboardPage;
