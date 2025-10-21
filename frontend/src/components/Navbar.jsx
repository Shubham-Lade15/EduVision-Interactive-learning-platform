import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, LogOut, Menu, X, Search } from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

// 🔍 Search Bar Component
const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Remove trailing/leading spaces and normalize
    const cleanQuery = query.trim().toLowerCase();

    // Redirect with search param (used by CourseListPage)
    navigate(`/courses?search_title=${encodeURIComponent(cleanQuery)}`);
    setQuery("");
  };



  return (
    <div className="relative hidden sm:block">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search courses..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-full px-4 py-1 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 transition"
        />
        <button
          type="submit"
          className="absolute right-2 top-1.5 text-gray-500 dark:text-gray-300"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

// 🧭 Main Navbar
const Navbar = ({ user, onLogout, theme, toggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Common link styles
  const linkStyle =
    "text-gray-700 dark:text-gray-200 hover:text-indigo-500 transition-colors";

  return (
    <nav
      className={`sticky top-0 z-50 shadow-sm border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#E0EAFC] to-[#CFDEF3] dark:from-[#232526] dark:to-[#414345]`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-2xl font-semibold text-gray-800 dark:text-white tracking-tight hover:opacity-80 transition"
          >
            EduVision
          </Link>

          {/* DESKTOP LINKS */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            {/* ---- Guest Navbar ---- */}
            {!user && (
              <>
                <Link to="/" className={linkStyle}>Home</Link>
                <Link to="/courses" className={linkStyle}>Courses</Link>
                <Link to="/about" className={linkStyle}>About</Link>
                <Link to="/contact" className={linkStyle}>Contact</Link>
              </>
            )}

            {/* ---- Tutor Navbar ---- */}
            {user?.role === "tutor" && (
              <>
                <Link to="/" className={linkStyle}>Home</Link>
                <Link to="/courses" className={linkStyle}>Courses</Link>
                <Link to="/tutor-dashboard" className={linkStyle}>Instructor Dashboard</Link>
                <Link to="/dashboard" className={linkStyle}>Dashboard</Link>
                <Link to="/about" className={linkStyle}>About</Link>
                <Link to="/contact" className={linkStyle}>Contact</Link>
              </>
            )}

            {/* ---- Student Navbar ---- */}
            {user?.role === "student" && (
              <>
                <Link to="/" className={linkStyle}>Home</Link>
                <Link to="/courses" className={linkStyle}>Courses</Link>
                <Link to="/my-courses" className={linkStyle}>My Learning</Link>
                <Link to="/about" className={linkStyle}>About</Link>
                <Link to="/contact" className={linkStyle}>Contact</Link>
              </>
            )}
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-4">
          <SearchBar />

          {/* THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:scale-105 transition-transform"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-100" />
            )}
          </button>

          {/* AUTH BUTTONS */}
          {!user ? (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md text-sm transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 border border-indigo-500 text-indigo-600 rounded-md text-sm hover:bg-indigo-50 dark:hover:bg-gray-800 transition"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/profile"
                className="px-3 py-1.5 border border-indigo-500 text-indigo-600 rounded-md text-sm hover:bg-indigo-50 dark:hover:bg-gray-800 transition"
              >
                Profile
              </Link>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          )}

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-3 px-6 space-y-3 text-sm">
          {!user && (
            <>
              <Link to="/" className={linkStyle} onClick={toggleMenu}>Home</Link>
              <Link to="/courses" className={linkStyle} onClick={toggleMenu}>Courses</Link>
              <Link to="/about" className={linkStyle} onClick={toggleMenu}>About</Link>
              <Link to="/contact" className={linkStyle} onClick={toggleMenu}>Contact</Link>
              <Link to="/login" className={linkStyle} onClick={toggleMenu}>Login</Link>
              <Link to="/register" className={linkStyle} onClick={toggleMenu}>Register</Link>
            </>
          )}

          {user?.role === "tutor" && (
            <>
              <Link to="/" className={linkStyle} onClick={toggleMenu}>Home</Link>
              <Link to="/courses" className={linkStyle} onClick={toggleMenu}>Courses</Link>
              <Link to="/tutor-dashboard" className={linkStyle} onClick={toggleMenu}>Instructor Dashboard</Link>
              <Link to="/dashboard" className={linkStyle} onClick={toggleMenu}>Dashboard</Link>
              <Link to="/about" className={linkStyle} onClick={toggleMenu}>About</Link>
              <Link to="/contact" className={linkStyle} onClick={toggleMenu}>Contact</Link>
              <Link to="/profile" className={linkStyle} onClick={toggleMenu}>Profile</Link>
              <button
                onClick={() => {
                  onLogout();
                  toggleMenu();
                }}
                className="text-red-600 dark:text-red-400"
              >
                Logout
              </button>
            </>
          )}

          {user?.role === "student" && (
            <>
              <Link to="/" className={linkStyle} onClick={toggleMenu}>Home</Link>
              <Link to="/courses" className={linkStyle} onClick={toggleMenu}>Courses</Link>
              <Link to="/my-courses" className={linkStyle} onClick={toggleMenu}>My Learning</Link>
              <Link to="/about" className={linkStyle} onClick={toggleMenu}>About</Link>
              <Link to="/contact" className={linkStyle} onClick={toggleMenu}>Contact</Link>
              <Link to="/profile" className={linkStyle} onClick={toggleMenu}>Profile</Link>
              <button
                onClick={() => {
                  onLogout();
                  toggleMenu();
                }}
                className="text-red-600 dark:text-red-400"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
