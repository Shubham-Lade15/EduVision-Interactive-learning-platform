// src/pages/CourseDetailPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';

function CourseDetailPage() {
  const { courseId } = useParams(); // This hook extracts the ID from the URL like /courses/123

  return (
    <div>
      <h1>Course Detail for Course ID: {courseId}</h1>
      <p>This page will show the video list and interactive player for this course.</p>
    </div>
  );
}

export default CourseDetailPage;