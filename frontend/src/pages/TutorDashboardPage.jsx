import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "../index.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const TutorDashboardPage = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorData = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Token ${token}` } };

        const [coursesRes, studentsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/tutor/courses/`, config),
          axios.get(`${API_BASE_URL}/api/tutor/students/`, config),
        ]);

        setCourses(coursesRes.data);
        setStudents(studentsRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tutor data:", error);
        setLoading(false);
      }
    };
    fetchTutorData();
  }, []);

  return (
    <div className="tutor-dashboard-page fade-in">
      <header className="tutor-header">
        <h1>Tutor Dashboard</h1>
        <p>Manage your courses, videos, and students with ease.</p>
      </header>

      {loading ? (
        <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>
      ) : (
        <>
          {/* === COURSE SECTION === */}
          <section className="tutor-section">
            <div className="tutor-section-header">
              <h2>Your Courses</h2>
              <Link
                to="/create-course"
                className="cta-btn primary"
              >
                ➕ Create New Course
              </Link>
            </div>

            {courses.length === 0 ? (
              <p>No courses yet. Start by creating one.</p>
            ) : (
              <div className="course-grid tutor-grid">
                {courses.map((course) => (
                  <motion.div
                    key={course.id}
                    className="course-card-grid small"
                    whileHover={{ scale: 1.04 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <div className="course-square-placeholder small" />
                    <div className="course-details">
                      <h3>{course.title}</h3>
                      <p className="course-tutor">
                        {course.students_count || 0} Students Enrolled
                      </p>
                      <Link
                        to={`/courses/${course.id}`}
                        className="cta-btn view-course-btn"
                      >
                        Manage Course
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* === UPLOAD SECTION === */}
          <section className="tutor-section upload-section">
            <h2>Upload New Video</h2>
            <Link
              to="/upload-video"
              className="cta-btn primary"
              style={{ marginTop: "10px" }}
            >
              ⬆️ Upload Video
            </Link>
          </section>

          {/* === STUDENT SECTION === */}
          <section className="tutor-section">
            <h2>Manage Students</h2>
            {students.length === 0 ? (
              <p>No students enrolled yet.</p>
            ) : (
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.course_title}</td>
                      <td>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${student.progress || 0}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default TutorDashboardPage;
