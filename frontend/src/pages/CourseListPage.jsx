import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "../index.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const CourseListPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/courses/`);
        setCourses(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="course-list-page fade-in">
      {/* HEADER */}
      <header className="course-list-header">
        <h1>All Courses</h1>
        <p>Choose from a variety of skill-building courses crafted for you.</p>
      </header>

      {/* COURSE GRID */}
      {loading ? (
        <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>
      ) : courses.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: "50px" }}>
          No courses found.
        </p>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              className="course-card-grid"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {/* Square gradient placeholder */}
              <div className="course-square-placeholder" />

              <div className="course-details">
                <h3>{course.title}</h3>
                <p className="course-tutor">
                  By {course.tutor_name || "EduVision Instructor"}
                </p>
                <Link
                  to={`/courses/${course.id}`}  // ✅ Corrected path
                  className="cta-btn view-course-btn"
                >
                  View Course
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseListPage;
