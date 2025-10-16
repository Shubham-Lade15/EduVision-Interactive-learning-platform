import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CreateCoursePage from './pages/CreateCoursePage';
import InstructorDashboardPage from './pages/InstructorDashboardPage';
import VideoUploadForm from './components/VideoUploadForm';
import Navbar from './components/Navbar'; 
import DashboardPage from './pages/DashboardPage';
import DashboardLayout from "./components/DashboardLayout";
import MyCoursesPage from "./pages/MyCoursesPage";
import TutorDashboardPage from "./pages/TutorDashboardPage";
import ProfilePage from "./pages/ProfilePage";




function App() {
    const [user, setUser] = useState(null);

    const handleLogin = (token, role, username) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('username', username); // Store username for display
        setUser({ username: username, role: role });
    };

    const handleLogout = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Step 1: Call backend API to delete the token
                await axios.post(
                    `${API_BASE_URL}/api/users/logout/`, 
                    null, // Body is empty
                    { headers: { Authorization: `Token ${token}` } }
                );
            } catch (error) {
                // If the server is down or token is invalid, proceed with client logout anyway
                console.error("Backend logout failed (token already invalid or server error):", error);
            }
        }
        
        // Step 2: Clear local storage and reset state
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setUser(null);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const username = localStorage.getItem('username'); // Retrieve stored username
        
        if (token && role) {
            // Ensure the user object is fully populated with all necessary fields
            setUser({ username: username || 'Authenticated User', role: role });
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
                <Route path="/instructor/dashboard" element={<InstructorDashboardPage user={user} />} />
                <Route path="/upload-video" element={<VideoUploadForm />} />
                <Route path="/dashboard" element={<DashboardPage user={user} />} />
                <Route path="/my-courses" element={<MyCoursesPage user={user} />} />
                <Route path="/tutor-dashboard" element={<TutorDashboardPage user={user} />} />
                <Route path="/profile" element={<ProfilePage user={user} />} />
            </Routes>
        </Router>
    );
}
export default App;