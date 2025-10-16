import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Component to display a single metric card
const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-200 ${color} transition duration-300 hover:shadow-xl`}>
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="text-2xl font-extrabold mb-1">{value}</h3>
        <p className="text-sm font-medium text-gray-500">{title}</p>
    </div>
);


function InstructorDashboardPage({ user }) {
    const [tutorCourses, setTutorCourses] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch data for the instructor dashboard
    useEffect(() => {
        const fetchInstructorData = async () => {
            if (!user || user.role !== 'tutor') {
                setLoading(false);
                setError('Access Denied. You must be logged in as a Tutor.');
                return;
            }

            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Token ${token}` } };

            try {
                // 1. Fetch Analytics Summary (Feature 2.4)
                const analyticsResponse = await axios.get(`${API_BASE_URL}/api/tutor/analytics/`, config);
                setAnalytics(analyticsResponse.data);

                // 2. Fetch Tutor's Created Courses (TutorCourseViewSet)
                const coursesResponse = await axios.get(`${API_BASE_URL}/api/tutor/courses/`, config);
                setTutorCourses(coursesResponse.data);

            } catch (err) {
                setError('Failed to fetch instructor data. Check API connection.');
                console.error("Instructor Dashboard API Error:", err.response || err);
            } finally {
                setLoading(false);
            }
        };

        fetchInstructorData();
    }, [user]);

    if (loading) return <div className="p-10 text-center">Loading Instructor Dashboard...</div>;
    if (error) return <div className="p-10 text-red-600 text-center font-semibold">{error}</div>;

    // --- Main Dashboard Rendering ---
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8">
                    Instructor Panel 👋
                </h1>
                
                {/* 1. Analytics Summary Cards - ENHANCED for Admin View */}
                {analytics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <StatCard 
                            title="Total Courses" 
                            value={analytics.course_stats.total_courses || 0} 
                            icon="📚" 
                            color="text-indigo-600"
                        />
                        <StatCard 
                            title="Total Enrollments" 
                            value={analytics.course_stats.total_enrollments || 0} 
                            icon="👥" 
                            color="text-green-600"
                        />
                        <StatCard 
                            title="Total Students" 
                            value={analytics.user_stats.total_students || 0} 
                            icon="🎓" 
                            color="text-yellow-600"
                        />
                        <StatCard 
                            title="Total Users" 
                            value={analytics.user_stats.total_users || 0} 
                            icon="🌎" 
                            color="text-gray-500"
                        />
                        <StatCard 
                            title="Your Courses" 
                            value={analytics.course_stats.tutor_courses || 0} 
                            icon="✍️" 
                            color="text-blue-600"
                        />
                        <StatCard 
                            title="Published Courses" 
                            value={analytics.course_stats.published_courses || 0} 
                            icon="✅" 
                            color="text-red-600"
                        />
                    </div>
                )}


                {/* 2. Course Management List */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-6 border-b pb-3">
                        <h2 className="text-2xl font-bold text-gray-800">My Course Management</h2>
                        <Link 
                            to="/create-course" 
                            className="bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
                        >
                            + Create New Course
                        </Link>
                    </div>
                    
                    {tutorCourses.length === 0 ? (
                        <p className="text-center text-gray-600 p-4">You have not created any courses yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {tutorCourses.map(course => (
                                <div 
                                    key={course.id} 
                                    className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition"
                                >
                                    <div>
                                        <Link to={`/courses/${course.id}`} className="text-xl font-semibold text-gray-900 hover:text-indigo-600">
                                            {course.title}
                                        </Link>
                                        <p className={`text-sm font-medium ${course.is_published ? 'text-green-600' : 'text-red-500'}`}>
                                            Status: {course.is_published ? 'Published' : 'Draft'}
                                        </p>
                                    </div>
                                    <div className="space-x-3 text-sm">
                                        <button className="text-indigo-600 hover:text-indigo-800 font-medium">Edit Content</button>
                                        <button className="text-yellow-600 hover:text-yellow-800 font-medium">Track Progress</button>
                                        <button className="text-red-600 hover:text-red-800 font-medium">Unpublish</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InstructorDashboardPage;