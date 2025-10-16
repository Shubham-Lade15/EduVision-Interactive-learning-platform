import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, handleLogout }) {
    // Determine the user's main dashboard link based on role
    const dashboardPath = user?.role === 'tutor' ? '/instructor/dashboard' : '/dashboard';
    const dashboardText = user?.role === 'tutor' ? 'Instructor Panel' : 'My Learning';

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Home Link */}
                    <Link to="/" className="flex items-center space-x-2 text-2xl font-extrabold text-indigo-600">
                        <span>EduVision</span>
                    </Link>

                    {/* Primary Navigation Links */}
                    <div className="hidden md:flex space-x-8 items-center">
                        <Link 
                            to="/courses" 
                            className="text-gray-600 hover:text-indigo-600 font-medium transition duration-150"
                        >
                            Browse Courses
                        </Link>
                        
                        {/* Conditional Dashboard Link */}
                        {user && (
                            <Link 
                                to={dashboardPath}
                                className="text-gray-600 hover:text-indigo-600 font-medium transition duration-150"
                            >
                                {dashboardText}
                            </Link>
                        )}
                    </div>

                    {/* Auth/User Actions */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                                    Welcome, <span className="font-semibold text-indigo-600">{user.username}</span>
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 text-white text-sm font-medium py-1.5 px-3 rounded-lg hover:bg-red-600 transition duration-150 shadow-md"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link 
                                    to="/login" 
                                    className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition"
                                >
                                    Sign In
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="bg-indigo-600 text-white text-sm font-medium py-1.5 px-3 rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
