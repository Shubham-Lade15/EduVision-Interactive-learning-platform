import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Code2, PenTool } from "lucide-react";

const HomePage = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f8fafc] via-[#eef2f7] to-[#f8fafc] dark:from-[#0f0f0f] dark:via-[#1a1a1a] dark:to-[#0f0f0f] text-gray-900 dark:text-gray-100 transition-colors duration-500 overflow-hidden">

      {/* ================= HERO SECTION ================= */}
      <section className="relative flex flex-col lg:flex-row items-center justify-between px-8 py-24 w-full max-w-7xl">
        {/* Animated Background Orb */}
        <motion.div
          className="absolute inset-0 flex justify-end lg:justify-center items-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="w-[520px] h-[520px] rounded-full blur-[140px] opacity-60 animate-slowGradient absolute right-[-120px] top-[-50px]
                         bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300 dark:from-indigo-700 dark:via-sky-600 dark:to-cyan-500" />
        </motion.div>

        {/* Hero Text */}
        <motion.div
          className="flex-1 space-y-6 text-center lg:text-left relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            EduVision:{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-400 text-transparent bg-clip-text">
              The Unscripted Classroom
            </span>
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0">
            Transform passive viewing into proven skill with mandatory AI quizzes,
            structured notes, and a real-time code editor — all in one seamless platform.
          </p>

          <div className="flex justify-center lg:justify-start gap-4 pt-4">
            <Link to="/courses" className="btn-primary text-base">
              Start Learning Now
            </Link>
            <Link to="/register" className="btn-outline text-base">
              Register Now
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ================= WHY UNSCRIPTED ================= */}
      <section className="w-full max-w-6xl px-8 py-24">
        <h2 className="section-title text-center mb-10">Why "Unscripted"?</h2>
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h3 className="text-xl font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
              The Passive Problem
            </h3>
            <p>
              Most e-learning relies on predictable video lectures and separate tools,
              leading to low engagement and poor retention.
              You watch a video — but do you master the concept?
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
              The EduVision Solution
            </h3>
            <p>
              We eliminate the "script" of passive learning by making learners prove
              their knowledge before moving forward. EduVision merges theory and
              practice into one dynamic environment.
            </p>
          </div>
        </div>
      </section>

      {/* ================= CORE FEATURES ================= */}
      <section className="w-full max-w-7xl px-8 py-24">
        <h2 className="section-title text-center mb-12">Core Feature Pillars</h2>
        <div className="grid md:grid-cols-3 gap-10">
          <div className="p-6 rounded-xl bg-white/50 dark:bg-gray-900/30 backdrop-blur-md text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <Brain className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">🧠 AI-Driven Engagement</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              In-video quizzes pause lessons with AI-generated questions to ensure
              comprehension. Auto-generated notes simplify revision.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white/50 dark:bg-gray-900/30 backdrop-blur-md text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <Code2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">💻 Real-Time Application</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Integrated code editor enables students to apply new concepts instantly —
              powered by Judge0 for secure, multi-language execution.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white/50 dark:bg-gray-900/30 backdrop-blur-md text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <PenTool className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">✍️ Creator Efficiency</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Tutors upload a video once — AI handles transcription, segmentation,
              quiz creation, and note generation — saving hours of prep.
            </p>
          </div>
        </div>
      </section>

      {/* ================= OUR TEAM ================= */}
      <section className="w-full max-w-7xl px-8 py-24">
        <h2 className="section-title text-center mb-12">Our Team</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { name: "Shubham Lade", email: "shubhamlade495@gmail.com" },
            { name: "Mugdha Zade", email: "zademugdha64@gmail.com" },
            { name: "Rayyan Sheikh", email: "sheikhrayyan291@gmail.com" },
            { name: "Sahil Domale", email: "sahildomale598@gmail.com" },
          ].map((member) => (
            <motion.div
              key={member.name}
              whileHover={{ scale: 1.03 }}
              className="text-center p-6 rounded-lg bg-white/50 dark:bg-gray-900/30 backdrop-blur-md hover:shadow-lg transition-all duration-300"
            >
              <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                {member.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">B.Tech CSE</p>
              <p className="text-sm mb-2">
                G H Raisoni College of Engineering, Nagpur
              </p>
              <a
                href={`mailto:${member.email}`}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {member.email}
              </a>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default HomePage;
