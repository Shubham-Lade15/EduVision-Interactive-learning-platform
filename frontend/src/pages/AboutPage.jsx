import React from "react";
import { motion } from "framer-motion";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2f7] dark:from-[#0f0f0f] dark:to-[#1a1a1a] text-gray-900 dark:text-gray-100 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto space-y-16"
      >
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
            About EduVision
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto">
            Redefining the boundaries of digital learning with innovation, interaction, 
            and intelligent automation — EduVision brings “The Unscripted Classroom” 
            to life.
          </p>
        </div>

        {/* Our Mission */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
        >
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-3">
            🎯 Our Mission: Redefining Digital Learning
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            EduVision was born from the need to eliminate passive learning and scattered
            resources, which hinder engagement, retention, and practical skill development
            across many existing e-learning platforms. Our mission is to transform video
            consumption into a genuinely active, measurable, and hands-on educational
            experience. We believe in learning by doing, not just by watching.
          </p>
        </motion.section>

        {/* The Unscripted Classroom */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
        >
          <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400 mb-3">
            🎬 The Power of the Unscripted Classroom
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            The “Unscripted Classroom” represents our commitment to moving beyond 
            predetermined lectures and into an environment where your engagement 
            directly dictates your progress. We enforce an active learning style that 
            blends theoretical knowledge with immediate practical application, ensuring 
            comprehension is verified at every step.
          </p>
        </motion.section>

        {/* Core Pillars of Innovation */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 space-y-6"
        >
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
            💡 Core Pillars of Innovation
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            We achieve active learning through the strategic integration of three powerful, 
            proprietary tools:
          </p>

          {/* Pillar 1 */}
          <div>
            <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400">
              1️⃣ Mandatory In-Video Quizzes
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              To ensure comprehension and focus, we embed AI-generated quizzes directly into 
              the video timeline. The video pauses, and learners must pass the assessment 
              to continue. This mandatory, real-time assessment model prevents skimming and 
              guarantees that knowledge acquisition is verified.
            </p>
          </div>

          {/* Pillar 2 */}
          <div>
            <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400">
              2️⃣ Integrated Code Editor
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We remove the friction of switching between learning and application. Our 
              system features a real-time, in-browser code editor (powered by the Judge0 API) 
              that allows students to apply concepts immediately as they learn — sharpening 
              practical, hands-on skills.
            </p>
          </div>

          {/* Pillar 3 */}
          <div>
            <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400">
              3️⃣ AI-Powered Content Automation
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Our platform uses advanced AI technologies like the Google Gemini API and 
              Whisper to streamline education for everyone. This intelligent system 
              automatically:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                Generates structured, summarized notes from video transcripts for 
                efficient revision.
              </li>
              <li>
                Creates logical video segments and personalized quiz questions 
                automatically.
              </li>
              <li>
                Significantly reduces the workload on educators while ensuring 
                content is always fresh and relevant.
              </li>
            </ul>
          </div>
        </motion.section>

        {/* Team Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-6"
        >
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
            👥 Our Team
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white text-2xl font-bold mb-4">
                  {member.name[0]}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {member.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {member.role}
                </p>
                <p className="text-sm mt-2 text-indigo-600 dark:text-indigo-400">
                  {member.email}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Closing Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16 text-gray-500 dark:text-gray-400 italic"
        >
          “The Unscripted Classroom isn’t just a tagline — it’s a revolution in learning.”  
          <br /> — Team EduVision
        </motion.div>
      </motion.div>
    </div>
  );
};

// Team Members
const teamMembers = [
  {
    name: "Shubham Lade",
    role: "B.Tech Computer Science & Engineering, G.H. Raisoni College of Engineering, Nagpur",
    email: "shubhamlade495@gmail.com",
  },
  {
    name: "Mugdha Zade",
    role: "B.Tech Computer Science & Engineering, G.H. Raisoni College of Engineering, Nagpur",
    email: "zademugdha64@gmail.com",
  },
  {
    name: "Rayyan Sheikh",
    role: "B.Tech Computer Science & Engineering, G.H. Raisoni College of Engineering, Nagpur",
    email: "sheikhrayyan291@gmail.com",
  },
  {
    name: "Sahil Domale",
    role: "B.Tech Computer Science & Engineering, G.H. Raisoni College of Engineering, Nagpur",
    email: "sahildomale598@gmail.com",
  },
];

export default AboutPage;
