import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CreateCoursePage from './pages/CreateCoursePage';
import VideoUploadForm from './components/VideoUploadForm';

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
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/courses" element={<CourseListPage user={user} />} />
                <Route path="/courses/:courseId" element={<CourseDetailPage user={user} />} />
                <Route path="/create-course" element={<CreateCoursePage />} />
                <Route path="/upload-video" element={<VideoUploadForm />} />
            </Routes>
        </Router>
    );
}
export default App;