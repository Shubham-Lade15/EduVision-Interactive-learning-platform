import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../index.css';

const Navbar = ({ user }) => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Apply theme to body
  useEffect(() => {
    if (darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [darkMode]);

  return (
    <nav className="navbar fade-in">
      {/* LOGO */}
      <div className="nav-logo" onClick={() => navigate('/')}>
        EduVision<span style={{ color: 'var(--color-secondary)' }}></span>
      </div>

      {/* SEARCH BAR */}
      <input
        type="text"
        placeholder="Search for courses..."
        className="search-bar"
      />

      {/* NAV LINKS */}
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/courses" className="nav-link">Courses</Link>
        {user && <Link to="/my-courses" className="nav-link">My Learning</Link>}
        <Link to="/about" className="nav-link">About</Link>

        {/* THEME TOGGLE */}
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle Theme"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* PROFILE */}
        {user ? (
          <div
            className="profile-avatar"
            onClick={() => navigate('/profile')}
            title="Go to Profile"
          >
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
        ) : (
          <Link to="/login" className="cta-btn">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
