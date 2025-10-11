import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "../index.css";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const ProfilePage = ({ user }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = token ? { headers: { Authorization: `Token ${token}` } } : {};
        const res = await axios.get(`${API_BASE_URL}/api/profile/`, config);
        setProfileData(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="page-loading">Loading Profile...</div>;

  const progress = profileData?.course_progress || 0;
  const completedCourses = profileData?.completed_courses || 0;
  const enrolledCourses = profileData?.enrolled_courses || 0;

  return (
    <div className="profile-page fade-in">
      {/* Header */}
      <motion.div 
        className="profile-header" 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="profile-avatar">
          <div className="avatar-circle">
            {profileData?.name ? profileData.name[0].toUpperCase() : "U"}
          </div>
        </div>
        <div className="profile-info">
          <h1>{profileData?.name || user?.username}</h1>
          <p className="profile-role">
            {profileData?.role ? profileData.role.toUpperCase() : "STUDENT"}
          </p>
          <p className="profile-email">{profileData?.email}</p>
        </div>
      </motion.div>

      {/* Info Cards */}
      <div className="profile-stats-grid">
        <motion.div 
          className="profile-card"
          whileHover={{ scale: 1.05 }}
        >
          <h3>Courses Enrolled</h3>
          <p className="stat-value">{enrolledCourses}</p>
        </motion.div>

        <motion.div 
          className="profile-card"
          whileHover={{ scale: 1.05 }}
        >
          <h3>Courses Completed</h3>
          <p className="stat-value">{completedCourses}</p>
        </motion.div>

        <motion.div 
          className="profile-card"
          whileHover={{ scale: 1.05 }}
        >
          <h3>Overall Progress</h3>
          <div className="circular-progress">
            <svg viewBox="0 0 36 36" className="circular-chart blue">
              <path
                className="circle-bg"
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="circle"
                strokeDasharray={`${progress}, 100`}
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">{progress}%</text>
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Personal Info */}
      <motion.div 
        className="personal-info-section"
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <h2>Personal Information</h2>
        <div className="info-list">
          <div className="info-item">
            <strong>Email:</strong> {profileData?.email}
          </div>
          <div className="info-item">
            <strong>Joined:</strong> {new Date(profileData?.date_joined).toLocaleDateString()}
          </div>
          <div className="info-item">
            <strong>Account Type:</strong> {profileData?.role}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
