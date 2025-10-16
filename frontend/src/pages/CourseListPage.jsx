import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/courses/";

function CourseListPage({ user }) {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // NEW STATE for Filtering
    const [filters, setFilters] = useState({
        language: '',
        min_duration: '',
    });

    // Fetches courses with current filters
    const fetchCourses = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const config = {
                headers: token ? { Authorization: `Token ${token}` } : {},
                // Pass filters as URL query parameters (Feature 1.5 logic)
                params: filters 
            };
            
            const response = await axios.get(API_URL, config);
            setCourses(response.data);
        } catch (err) {
            setError("Failed to load courses. Check permissions or filters.");
            console.error("Error fetching filtered courses:", err.response || err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [filters.language, filters.min_duration, user]); // Refetch whenever key filters change

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Placeholder for common categories (should match data you have)
    const commonLanguages = ["English", "Spanish", "French", "German"];

    if (loading) return <div className="text-center p-8">Loading courses...</div>;
    if (error) return <div className="text-red-500 p-8">Error: {error}</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-extrabold mb-8 text-gray-900">Explore Our Catalog</h1>
            
            <div className="flex flex-col md:flex-row space-x-0 md:space-x-6">
                
                {/* Filters Sidebar */}
                <div className="w-full md:w-1/4 bg-white p-6 rounded-xl shadow-lg mb-6 md:mb-0 border border-gray-100 sticky top-4 self-start">
                    <h3 className="text-xl font-bold mb-4 border-b pb-3 text-gray-800">Filters</h3>
                    
                    {/* Language Filter */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                        <select
                            name="language"
                            value={filters.language}
                            onChange={handleFilterChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">All Languages</option>
                            {commonLanguages.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>

                    {/* Duration Filter */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Duration (Hours)</label>
                        <input
                            type="number"
                            name="min_duration"
                            value={filters.min_duration}
                            onChange={handleFilterChange}
                            placeholder="e.g. 5"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    
                    {/* Price/Certificates filter placeholders could go here */}
                    
                    <button
                        onClick={fetchCourses}
                        className="w-full bg-indigo-600 text-white p-2.5 mt-4 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md"
                    >
                        Apply Filters
                    </button>
                </div>
                
                {/* Course Grid / Results */}
                <div className="w-full md:w-3/4">
                    {user?.role === 'tutor' && (
                        <div className="mb-6 flex justify-end space-x-4">
                            <Link to="/create-course" className="text-indigo-600 hover:text-indigo-800 font-medium">Add New Course</Link>
                            <Link to="/upload-video" className="text-indigo-600 hover:text-indigo-800 font-medium">Upload New Video</Link>
                        </div>
                    )}
                    
                    {courses.length === 0 ? (
                        <p className="text-center text-gray-500 mt-10 p-10 bg-white rounded-lg shadow-md">
                            No courses found matching your criteria. Try adjusting the filters.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map(course => (
                                <Link 
                                    to={`/courses/${course.id}`} 
                                    key={course.id} 
                                    className="block bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition duration-300 overflow-hidden group"
                                >
                                    <div className="p-5">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${course.is_published ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} mb-2 inline-block`}>
                                            {course.is_published ? 'Published' : 'Draft'}
                                        </span>
                                        <h2 className="text-xl font-extrabold text-gray-900 mb-2 group-hover:text-indigo-600 transition">
                                            {course.title}
                                        </h2>
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{course.short_description || course.description.substring(0, 50) + '...'}</p>
                                        
                                        <div className="border-t pt-3 flex justify-between items-center text-sm text-gray-500">
                                            <span className="flex items-center space-x-1">
                                                📚 {course.videos ? course.videos.length : 0} Lessons
                                            </span>
                                            <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                                                {course.duration_hours} Hrs ({course.language})
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CourseListPage;