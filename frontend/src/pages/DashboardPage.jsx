import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function DashboardPage({ user }) {
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
  });
  const [enrollmentTrends, setEnrollmentTrends] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "tutor") return;

    const token = localStorage.getItem("token");

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Fetch all courses created by this tutor
        const resCourses = await axios.get(`${API_BASE_URL}/api/courses/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const tutorCourses = resCourses.data.filter(
          (c) => c.tutor_username === user.username
        );

        const totalCourses = tutorCourses.length;
        const publishedCourses = tutorCourses.filter(
          (c) => c.is_published
        ).length;

        // 2️⃣ Fetch all enrollments for tutor’s courses
        const resEnrollments = await axios.get(
          `${API_BASE_URL}/api/enrollments/`,
          { headers: { Authorization: `Token ${token}` } }
        );

        // Filter only enrollments for tutor’s courses
        const tutorEnrollments = resEnrollments.data.filter((e) =>
          tutorCourses.some((course) => course.id === e.course)
        );

        // Compute total unique students
        const uniqueStudents = [
          ...new Set(tutorEnrollments.map((e) => e.student_username)),
        ];

        // Prepare enrollment trend data (by date)
        const trendMap = {};
        tutorEnrollments.forEach((e) => {
          const date = new Date(e.enrollment_date).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
          });
          trendMap[date] = (trendMap[date] || 0) + 1;
        });

        const trendData = Object.entries(trendMap).map(([date, count]) => ({
          date,
          count,
        }));

        // Update states
        setStats({
          totalCourses,
          publishedCourses,
          totalStudents: uniqueStudents.length,
        });
        setEnrollmentTrends(trendData);
        setEnrolledStudents(tutorEnrollments);
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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


  // Chart data
  const trendChartData = {
    labels: enrollmentTrends.map((t) => t.date),
    datasets: [
      {
        label: "Enrolled Students",
        data: enrollmentTrends.map((t) => t.count),
        backgroundColor: "rgba(79, 70, 229, 0.6)",
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent mb-8 text-center">
          Tutor Dashboard
        </h1>

        {/* === STAT CARDS === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-white/70 dark:bg-gray-900/70 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center"
          >
            <h3 className="text-lg font-semibold text-indigo-600">Total Courses</h3>
            <p className="text-3xl font-bold mt-2">{stats.totalCourses}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-white/70 dark:bg-gray-900/70 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center"
          >
            <h3 className="text-lg font-semibold text-sky-600">Published Courses</h3>
            <p className="text-3xl font-bold mt-2">{stats.publishedCourses}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-white/70 dark:bg-gray-900/70 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center"
          >
            <h3 className="text-lg font-semibold text-cyan-600">Active Students</h3>
            <p className="text-3xl font-bold mt-2">{stats.totalStudents}</p>
          </motion.div>
        </div>

        {/* === ENROLLMENT TREND CHART === */}
        <div className="bg-white/70 dark:bg-gray-900/70 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Enrollment Trends
          </h2>
          {enrollmentTrends.length > 0 ? (
            <Bar data={trendChartData} />
          ) : (
            <p className="text-gray-500">No enrollment data yet.</p>
          )}
        </div>

        {/* === ENROLLED STUDENTS TABLE === */}
        <div className="bg-white/70 dark:bg-gray-900/70 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Enrolled Students Details
          </h2>
          {enrolledStudents.length === 0 ? (
            <p className="text-gray-500">No students enrolled yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="bg-indigo-100 dark:bg-gray-800 text-left">
                    <th className="py-3 px-4 font-semibold">Student</th>
                    <th className="py-3 px-4 font-semibold">Course</th>
                    <th className="py-3 px-4 font-semibold">Enrollment Date</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((enroll, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <td className="py-3 px-4">{enroll.student_username}</td>
                      <td className="py-3 px-4">{enroll.course_title}</td>
                      <td className="py-3 px-4">
                        {new Date(enroll.enrollment_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
