import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const ProfilePage = ({ user }) => {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({ email: "", username: "" });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const [analytics, setAnalytics] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    progressData: [],
  });

  const token = localStorage.getItem("token");

  // Fetch user profile and analytics
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/profile/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setProfile(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setLoading(false);
      }
    };

    const fetchAnalytics = async () => {
      if (user?.role === "student") {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/courses/my-courses/`, {
            headers: { Authorization: `Token ${token}` },
          });

          const enrolled = res.data.length;
          const completed = res.data.filter((c) => c.is_completed).length;

          const progressData = res.data.map((c) => ({
            course: c.title,
            progress: c.progress_percentage || 0,
          }));

          setAnalytics({
            enrolledCourses: enrolled,
            completedCourses: completed,
            progressData,
          });
        } catch (err) {
          console.error("Error fetching analytics:", err);
        }
      }
    };

    fetchProfile();
    fetchAnalytics();
  }, [user]);

  // Handle profile updates
  const handleEditToggle = () => setEditing(!editing);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });

    let newErrors = { ...errors };

    // Email validation
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      newErrors.email = emailRegex.test(value) ? "" : "Enter a valid email address";
    }

    // Username validation
    if (name === "username") {
      const usernameRegex = /^[A-Za-z0-9_]{3,20}$/;
      newErrors.username = usernameRegex.test(value)
        ? ""
        : "Username must be 3–20 characters (letters, numbers, underscores)";
    }

    setErrors(newErrors);
  };


  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview before upload
    setImagePreview(URL.createObjectURL(file));

    const formData = new FormData();

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE_URL}/api/users/profile/update/`,
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          },
        }
      );

      // Reset progress bar after success
      setTimeout(() => setUploadProgress(0), 1200);
      alert("✅ Profile picture updated successfully!");
      setProfile(res.data);
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      alert("❌ Upload failed. Please try again.");
      setUploadProgress(0);
    }
  };


  const handleSave = async () => {
    // ✅ Frontend validation before sending to backend
    if (errors.email) {
      alert("Email is invalid. Please enter a valid email.");
      return;
    }

    if (errors.username) {
      alert("Username is invalid. Please enter a valid username.");
      return;
    }

    const formData = new FormData();
    Object.keys(profile).forEach((key) => {
      formData.append(key, profile[key]);
    });

    try {
      await axios.put(`${API_BASE_URL}/api/users/profile/update/`, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("✅ Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      // --- 🔍 Handle backend validation errors precisely ---
      const backendErrors = err.response?.data || {};

      if (backendErrors.username) {
        alert("This username is already taken. Please choose another one.");
      } else if (backendErrors.email) {
        alert("Email is invalid. Please enter a valid email.");
      } else {
        alert("Profile update failed. Please try again.");
      }

      console.error("Profile update failed:", backendErrors);
    }
  };


  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        Loading profile...
      </div>
    );

  // Chart setup for student analytics
  const chartData = {
    labels: analytics.progressData.map((c) => c.course),
    datasets: [
      {
        label: "Progress (%)",
        data: analytics.progressData.map((c) => c.progress),
        backgroundColor: "rgba(79, 70, 229, 0.6)",
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="max-w-5xl mx-auto bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent">
          {user?.role === "tutor" ? "Tutor Profile" : "Student Profile"}
        </h1>

        {/* Profile Section */}
        {/* Animated Avatar */}
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg animate-pulse bg-gradient-to-br from-indigo-500 via-sky-400 to-cyan-400">
              {(profile.first_name?.charAt(0) ||
                profile.username?.charAt(0) ||
                "?"
              ).toUpperCase()}
            </div>
          </div>


          {/* Profile Info */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["username", "email", "first_name", "last_name", "role"].map(
              (field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-500 capitalize">
                    {field.replace("_", " ")}
                  </label>
                  {editing && field !== "role" ? (
                    <>
                      <input
                        type={field === "email" ? "email" : "text"}
                        name={field}
                        value={profile[field] || ""}
                        onChange={handleInputChange}
                        className={`mt-1 w-full p-2 rounded-md border ${
                          errors[field]
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 focus:ring-indigo-500"
                        } focus:outline-none focus:ring-2 transition`}
                      />
                      {errors[field] && (
                        <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
                      )}
                    </>
                  ) : (
                    <p className="mt-1 text-gray-800 dark:text-gray-200">
                      {profile[field] || "—"}
                    </p>
                  )}
                  </div>
              )
            )}
          </div>
        </div>

        {/* Edit / Save Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          {!editing ? (
            <button
              onClick={handleEditToggle}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Save Changes
              </button>
              <button
                onClick={handleEditToggle}
                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {/* === STUDENT ANALYTICS SECTION === */}
        {user?.role === "student" && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-indigo-600 mb-4">
              Learning Analytics
            </h2>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-4 bg-indigo-50 dark:bg-gray-800 rounded-xl shadow"
              >
                <h3 className="text-lg text-indigo-600 font-semibold">
                  Enrolled Courses
                </h3>
                <p className="text-2xl font-bold mt-2">
                  {analytics.enrolledCourses}
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-4 bg-sky-50 dark:bg-gray-800 rounded-xl shadow"
              >
                <h3 className="text-lg text-sky-600 font-semibold">
                  Completed Courses
                </h3>
                <p className="text-2xl font-bold mt-2">
                  {analytics.completedCourses}
                </p>
              </motion.div>
            </div>

            {/* Progress Chart */}
            <div className="bg-white/70 dark:bg-gray-900/70 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Course Progress Overview
              </h3>
              {analytics.progressData.length > 0 ? (
                <Bar data={chartData} />
              ) : (
                <p className="text-gray-500">
                  You haven’t enrolled in any courses yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
