import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';

function DashboardPage({ user }) {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to calculate course progress (reused logic)
    const calculateCourseProgress = (course) => {
        if (!course || !course.videos || course.videos.length === 0) return 0;
        let total = course.videos.length * 2; // 2 points per video (watch + quizzes)
        let earned = 0;
        course.videos.forEach(v => {
            const p = v.current_user_progress || { video_completed: false, all_quizzes_passed: false };
            if (p.video_completed) earned += 1;
            if (p.all_quizzes_passed) earned += 1;
        });
        return total > 0 ? Math.round((earned / total) * 100) : 0;
    };

    // Fetch enrolled courses using the API implemented in Feature 1.3
    useEffect(() => {
        const fetchMyCourses = async () => {
            if (!user || user.role !== 'student') {
                setLoading(false);
                setError('Access Denied. Please log in as a student.');
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Token ${token}` } };
                
                // CRITICAL: Use the My Courses API endpoint (Feature 1.3)
                const response = await axios.get(`${API_BASE_URL}/api/courses/my-courses/`, config);
                setEnrolledCourses(response.data);
            } catch (err) {
                setError('Failed to fetch enrolled courses.');
                console.error("My Courses API Error:", err.response || err);
            } finally {
                setLoading(false);
            }
        };

        fetchMyCourses();
    }, [user]);

    if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;
    if (error) return <div className="p-10 text-red-600 text-center font-semibold">{error}</div>;

    // --- Main Dashboard Rendering ---
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
                    {user?.username}'s Learning Dashboard 🧑‍🎓
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    
                    {/* Left Sidebar (Navigation Stub - Feature 4.1 Expansion) */}
                    <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">Dashboard Menu</h2>
                        <ul className="space-y-2">
                            <li className="text-indigo-600 font-semibold">My Courses</li>
                            <li><Link to="/profile" className="text-gray-600 hover:text-indigo-600">Profile Settings</Link></li>
                            <li><Link to="/certificates" className="text-gray-600 hover:text-indigo-600">Certificates</Link></li>
                        </ul>
                    </div>

                    {/* Main Content Area (My Courses List) */}
                    <div className="md:col-span-3">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Enrolled Courses</h2>
                        
                        {enrolledCourses.length === 0 ? (
                            <div className="p-8 bg-white rounded-xl shadow-md text-center text-gray-600">
                                You are not currently enrolled in any courses. <Link to="/courses" className="text-indigo-600 font-medium hover:underline">Browse the catalog to start learning!</Link>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {enrolledCourses.map(course => {
                                    const progressPercent = calculateCourseProgress(course);
                                    return (
                                        <div 
                                            key={course.id} 
                                            className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center border border-gray-200"
                                        >
                                            <div className="w-full">
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h3>
                                                <p className="text-sm text-gray-500 mb-3 line-clamp-1">{course.short_description || course.description.substring(0, 80) + '...'}</p>
                                                
                                                {/* Progress Bar */}
                                                <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                                                    <div 
                                                        style={{ width: `${progressPercent}%` }} 
                                                        className="h-full bg-green-500 rounded-full transition-all duration-700"
                                                    />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-700">{progressPercent}% Complete</p>
                                            </div>

                                            {/* CTA Button */}
                                            <Link 
                                                to={`/courses/${course.id}`}
                                                className="ml-6 flex-shrink-0 bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
                                            >
                                                Resume Course
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;