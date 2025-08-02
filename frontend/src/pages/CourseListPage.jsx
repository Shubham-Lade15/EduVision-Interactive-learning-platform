// src/pages/CourseListPage.jsx (example)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // For linking to individual course pages

const API_URL = 'http://127.0.0.1:8000/api/courses/'; // Update if your backend URL changes

function CourseListPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(API_URL);
        setCourses(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch courses. Please check the backend server.');
        setLoading(false);
        console.error("Error fetching courses:", err);
      }
    };
    fetchCourses();
  }, []); // Empty dependency array means this runs once on component mount

  if (loading) return <div>Loading courses...</div>;
  if (error) return <div>Error: {error}</div>;
  if (courses.length === 0) return <div>No courses available yet.</div>;


  return (
    <div>
      <h1>Available Courses</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {courses.map(course => (
          <div key={course.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', width: '300px' }}>
            <h2><Link to={`/courses/${course.id}`}>{course.title}</Link></h2>
            <p>{course.description}</p>
            {/* Add more course details if needed */}
          </div>
        ))}
      </div>
      <Link to="/admin-add-course" style={{ marginTop: '20px', display: 'block' }}>Add New Course (Admin/Instructor)</Link>
    </div>
  );
}

export default CourseListPage;