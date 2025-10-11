// src/components/CourseCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
  const [hovered, setHovered] = useState(false);

  const cardStyle = {
    width: '300px',
    borderRadius: '15px',
    overflow: 'hidden',
    margin: '15px',
    boxShadow: hovered
      ? '0 12px 25px rgba(0, 0, 0, 0.25)'
      : '0 8px 20px rgba(0, 0, 0, 0.15)',
    transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
    transition: 'all 0.3s ease',
  };

  const gradientStyle = {
    padding: '20px',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    background: hovered
      ? 'linear-gradient(135deg, #2575fc, #6a11cb)'
      : 'linear-gradient(135deg, #6a11cb, #2575fc)',
    color: 'white',
    transition: 'background 0.5s ease',
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '10px',
  };

  const descStyle = {
    flexGrow: 1,
    fontSize: '1rem',
    marginBottom: '15px',
  };

  const linkStyle = {
    alignSelf: 'flex-start',
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 500,
    transition: 'background 0.3s ease',
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={gradientStyle}>
        <h3 style={titleStyle}>{course.title}</h3>
        <p style={descStyle}>{course.description}</p>
        <Link
          to={`/courses/${course.id}`}
          style={{
            ...linkStyle,
            backgroundColor: hovered
              ? 'rgba(255, 255, 255, 0.4)'
              : 'rgba(255, 255, 255, 0.2)',
          }}
        >
          View Course
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
