import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CreateCoursePage from './pages/CreateCoursePage';
import VideoUploadForm from './components/VideoUploadForm';
import Navbar from './components/Navbar'; 
import DashboardHome from "./pages/DashboardHome";
import DashboardLayout from "./components/DashboardLayout";
import MyCoursesPage from "./pages/MyCoursesPage";
import TutorDashboardPage from "./pages/TutorDashboardPage";
import ProfilePage from "./pages/ProfilePage";




function App() {
    const [user, setUser] = useState(null);

    const handleLogin = (token, role) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        setUser({ username: 'Authenticated User', role: role });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setUser(null);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (token && role) {
            setUser({ username: 'Authenticated User', role: role });
        }
    }, []);

    return (
        <Router>
            <Navbar user={user} handleLogout={handleLogout} />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/courses" element={<CourseListPage user={user} />} />
                <Route path="/courses/:courseId" element={<CourseDetailPage user={user} />} />
                <Route path="/create-course" element={<CreateCoursePage />} />
                <Route path="/upload-video" element={<VideoUploadForm />} />
                <Route path="/dashboard" element={<DashboardHome user={user} />} />
                <Route path="/my-courses" element={<MyCoursesPage user={user} />} />
                <Route path="/tutor-dashboard" element={<TutorDashboardPage user={user} />} />
                <Route path="/profile" element={<ProfilePage user={user} />} />
            </Routes>
        </Router>
    );
}
export default App;