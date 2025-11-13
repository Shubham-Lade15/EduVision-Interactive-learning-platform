// frontend/src/components/LoginForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';

function LoginForm({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/login/`, {
                username,
                password
            });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            // CRITICAL FIX: Pass username and role to App's handler
            onLogin(response.data.token, response.data.role, response.data.username);
            setMessage('Login successful!');
            setTimeout(() => {
                 navigate('/courses');
            }, 500);
        } catch (error) {
            setMessage('Login failed. Please check your credentials.');
            console.error("Login error:", error.response || error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 transition-colors duration-500">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors duration-500">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-6">Welcome Back</h2>

                {/* Social Login Placeholder (Updated styles)
                <div className="space-y-3 mb-6">
                    <button className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-150">
                        <span className="text-xl mr-2">G</span> Continue with Google
                    </button>
                    <button className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-150">
                        <span className="text-xl mr-2">f</span> Continue with Facebook
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or sign in with username</span>
                    </div>
                </div> */}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 dark:focus:ring-purple-500 focus:border-indigo-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-150"
                            placeholder="Your unique username"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 dark:focus:ring-purple-500 focus:border-indigo-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-150"
                            placeholder="********"
                            disabled={isLoading}
                        />
                    </div>

                    {message && <p className={`text-sm font-medium ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}

                    <button
                        type="submit"
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-indigo-600 dark:bg-purple-600 hover:bg-indigo-700 dark:hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-purple-500 transition duration-150"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                        Don't have an account? <Link to="/register" className="font-medium text-indigo-600 dark:text-purple-400 hover:text-indigo-500 dark:hover:text-purple-500 transition">Sign up here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginForm;