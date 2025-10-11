import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
} from "lucide-react"; // icons
import "../index.css";

const Sidebar = ({ user }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div>
        <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          <Menu />
        </button>
        <div className="sidebar-top">
          <Link to="/dashboard" className="sidebar-link">
            <Home className="sidebar-icon" /> {!collapsed && "Dashboard"}
          </Link>
          <Link to="/my-courses" className="sidebar-link">
            <BookOpen className="sidebar-icon" /> {!collapsed && "My Courses"}
          </Link>
          <Link to="/profile" className="sidebar-link">
            <User className="sidebar-icon" /> {!collapsed && "Profile"}
          </Link>
          {user?.role === "tutor" && (
            <Link to="/tutor-dashboard" className="sidebar-link">
              <LayoutDashboard className="sidebar-icon" /> {!collapsed && "Tutor Panel"}
            </Link>
          )}
        </div>
      </div>

      <div className="sidebar-bottom">
        <button onClick={handleLogout} className="sidebar-link" style={{ background: "none" }}>
          <LogOut className="sidebar-icon" /> {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
