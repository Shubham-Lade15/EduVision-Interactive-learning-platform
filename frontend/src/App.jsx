import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import axios from "axios";

// 🌐 Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PageFade from "./components/PageFade";

// 📄 Pages
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import CourseListPage from "./pages/CourseListPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CreateCoursePage from "./pages/CreateCoursePage";
import MyCoursesPage from "./pages/MyCoursesPage";
import ProfilePage from "./pages/ProfilePage";
import TutorDashboardPage from "./pages/TutorDashboardPage";
import DashboardPage from "./pages/DashboardPage";
import VideoUploadForm from "./components/VideoUploadForm";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CourseInfoPage from "./pages/CourseInfoPage";
import EnrolledPage from "./pages/EnrolledPage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/* 🌗 THEME LOGIC */
const getInitialTheme = () => {
  if (
    localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    return "dark";
  }
  return "light";
};

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));

  return children({ theme, toggleTheme });
}

/* 🌀 PAGE TRANSITION WRAPPER */
function AppRoutesWrapper({ user, handleLogin }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageFade><HomePage user={user} /></PageFade>} />
        <Route path="/about" element={<PageFade><AboutPage /></PageFade>} />
        <Route path="/contact" element={<PageFade><ContactPage /></PageFade>} />
        <Route path="/courses" element={<PageFade><CourseListPage user={user} /></PageFade>} />
        <Route path="/courses/:courseId" element={<PageFade><CourseDetailPage user={user} /></PageFade>} />
        <Route path="/create-course" element={<PageFade><CreateCoursePage /></PageFade>} />
        <Route path="/my-courses" element={<PageFade><MyCoursesPage user={user} /></PageFade>} />
        <Route path="/profile" element={<PageFade><ProfilePage user={user} /></PageFade>} />
        <Route path="/tutor-dashboard" element={<PageFade><TutorDashboardPage user={user} /></PageFade>} />
        <Route path="/dashboard" element={<PageFade><DashboardPage user={user} /></PageFade>} />
        <Route path="/upload-video" element={<PageFade><VideoUploadForm /></PageFade>} />
        <Route path="/login" element={<PageFade><LoginPage onLogin={handleLogin} /></PageFade>} />
        <Route path="/register" element={<PageFade><RegisterPage /></PageFade>} />
        <Route path="/course-info/:courseId" element={<PageFade><CourseInfoPage /></PageFade>} />
        <Route path="/enrolled/:courseName" element={<PageFade><EnrolledPage /></PageFade>} />
      </Routes>
    </AnimatePresence>
  );
}

/* 🌟 MAIN APP COMPONENT */
function App() {
  const [user, setUser] = useState(null);

  /* 🔐 LOGIN HANDLER */
  const handleLogin = (token, role, username) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("username", username);
    setUser({ username, role });
  };

  /* 🚪 LOGOUT HANDLER */
  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await axios.post(`${API_BASE_URL}/api/users/logout/`, null, {
          headers: { Authorization: `Token ${token}` },
        });
      } catch (error) {
        console.error("Logout failed or already invalid:", error);
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setUser(null);
  };

  /* 🧠 LOAD USER ON REFRESH */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");
    if (token && role) {
      setUser({ username: username || "User", role });
    }
  }, []);

  /* 🌈 APP LAYOUT WITH THEME CONTEXT */
  return (
    <ThemeProvider>
      {({ theme, toggleTheme }) => (
        <Router>
          {/* 🧭 NAVBAR */}
          <Navbar
            user={user}
            onLogout={handleLogout}
            theme={theme}
            toggleTheme={toggleTheme}
          />

          {/* 💫 PAGE ROUTES WITH ANIMATION */}
          <div className="min-h-[85vh] app-bg transition-all duration-300">
            <AppRoutesWrapper user={user} handleLogin={handleLogin} />
          </div>

          {/* 🌐 GLOBAL FOOTER */}
          <Footer />
        </Router>
      )}
    </ThemeProvider>
  );
}

export default App;
