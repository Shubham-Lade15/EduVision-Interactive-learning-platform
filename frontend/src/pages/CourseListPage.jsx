// src/pages/CourseListPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/courses/";

function CourseListPage({ user }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log("CourseListPage received user:", user);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(API_URL, {
          headers: token ? { Authorization: `Token ${token}` } : {},
        });
        setCourses(response.data);
      } catch (err) {
        setError("Failed to load courses.");
        console.error("Error fetching courses:", err.response || err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) return <div>Loading courses...</div>;
  if (error) return <div>Error: {error}</div>;

  const handleAddCourse = () => {
    navigate("/admin-add-course");
  };
  return (
        <div>
        <h1>Available Courses</h1>
        {user?.role === 'tutor' && (
            <div style={{ marginBottom: '20px' }}>
                <Link to="/create-course" style={{ marginRight: '10px' }}>Add New Course</Link>
                <Link to="/upload-video">Upload New Video</Link>
            </div>
            )}
            {/* ... your courses list ... */}
        </div>
    );
}
export default CourseListPage;