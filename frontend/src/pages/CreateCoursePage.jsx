import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

const CreateCoursePage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [skillsGained, setSkillsGained] = useState("");
  const [outcome, setOutcome] = useState("");
  const [language, setLanguage] = useState("English");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/courses/`,
        {
          title,
          description,
          about,
          skills_gained: skillsGained,
          outcome,
          language,
          duration_hours: duration,
        },
        { headers: { Authorization: `Token ${token}` } }
      );

      setMessage("✅ Course created successfully!");
      setTimeout(() => navigate("/tutor-dashboard"), 1000);
    } catch (error) {
      console.error("Error creating course:", error);
      setMessage("❌ Failed to create course. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2f7] dark:from-[#0f0f0f] dark:to-[#1a1a1a] flex justify-center items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800"
      >
        {/* HEADER */}
        <h1 className="text-3xl font-extrabold text-center mb-6 bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
          🎓 Create a New Course
        </h1>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
              Course Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              placeholder="e.g. Mastering React.js Fundamentals"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
              Description
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              placeholder="Briefly describe your course..."
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
              About
            </label>
            <textarea
              required
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="What will students learn from this course?"
              className="w-full border p-2 rounded-md"
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
              Skills Gained
            </label>
            <textarea
              required
              value={skillsGained}
              onChange={(e) => setSkillsGained(e.target.value)}
              placeholder="Skills you'll gain (comma-separated)"
              className="w-full border p-2 rounded-md"
            ></textarea>
            </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
              Outcomes
            </label>
            <textarea
              required
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="Expected course outcome"
              className="w-full border p-2 rounded-md"
            ></textarea>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-400 transition"
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Marathi</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Duration (hours)
              </label>
              <input
                type="number"
                required
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="e.g. 12"
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 text-white font-semibold rounded-lg shadow-md transition-all duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600"
            }`}
          >
            {loading ? "Creating..." : "Create Course"}
          </button>
        </form>

        {/* FEEDBACK MESSAGE */}
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

export default CreateCoursePage;
