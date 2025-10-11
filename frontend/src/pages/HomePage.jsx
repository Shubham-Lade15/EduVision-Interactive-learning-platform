import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../index.css";

const Homepage = () => {
  return (
    <div className="homepage fade-in">
      {/* HERO SECTION */}
      <section className="hero-section">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1>
            Empower Your Future with <span className="gradient-text">EduVision</span>
          </h1>
          <p>
            The next-generation learning platform — designed to make education interactive, personalized, and powered by AI.
          </p>
          <div className="hero-buttons">
            <Link to="/courses" className="cta-btn primary">
              Explore Courses
            </Link>
            <Link to="/about" className="cta-btn secondary">
              Learn More
            </Link>
          </div>
        </motion.div>

        {/* ANIMATED BACKGROUND GRADIENT */}
        <motion.div
          className="hero-visual"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        >
          <div className="animated-gradient"></div>
        </motion.div>
      </section>

      {/* COMING SOON SECTION */}
      <section className="coming-soon">
        <h2>🚀 Upcoming Features</h2>
        <p>Stay tuned for Featured Courses, Smart Recommendations, and more enhancements!</p>
      </section>
    </div>
  );
};

export default Homepage;
