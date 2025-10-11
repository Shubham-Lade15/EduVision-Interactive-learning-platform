import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "../index.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const MyCoursesPage = ({ user }) => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Token ${token}` } };
        const response = await axios.get(`${API_BASE_URL}/api/my-courses/`, config);
        setEnrolledCourses(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching enrolled courses:", error);
        setLoading(false);
      }
    };
    fetchEnrolledCourses();
  }, []);

  return (
    <div className="my-courses-page fade-in">
      {/* HEADER */}
      <header className="my-courses-header">
        <h1>My Courses</h1>
        <p>Continue your learning journey with your enrolled courses.</p>
      </header>

      {/* COURSES GRID */}
      {loading ? (
        <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>
      ) : enrolledCourses.length === 0 ? (
        <div className="no-courses">
          <p>You haven’t enrolled in any courses yet.</p>
          <Link to="/courses" className="cta-btn primary">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="my-courses-grid">
          {enrolledCourses.map((course) => (
            <motion.div
              key={course.id}
              className="my-course-card"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {/* Gradient Square Visual */}
              <div className="course-square-placeholder small" />

              <div className="my-course-details">
                <h3>{course.title}</h3>
                <p className="course-tutor">
                  By {course.tutor_name || "EduVision Instructor"}
                </p>

                {/* Placeholder progress bar */}
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${course.progress || 40}%` }}
                  ></div>
                </div>

                <Link
                  to={`/courses/${course.id}`}
                  className="cta-btn continue-btn"
                >
                  Continue Learning
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage;
