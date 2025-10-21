// frontend/src/components/RegisterForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';

function RegisterForm() {
    // STATE VARIABLES FOR EXPANDED FIELDS
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState(''); // Confirm Password field
    const [role, setRole] = useState('student');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/register/`, {
                username,
                email,
                first_name: firstName,
                last_name: lastName,
                password,
                password2, // Send confirm password for backend validation
                role
            });
            setMessage('Registration successful! Please log in.');
            setTimeout(() => {
                navigate('/login');
            }, 1000); // Redirect to login page after successful registration
        } catch (error) {
            console.error('Registration error:', error.response ? error.response.data : error.message);

            // Handle and display specific error messages from the backend (e.g., unique username, password strength)
            if (error.response && error.response.data) {
                let errorMessages = [];
                for (const key in error.response.data) {
                    if (Array.isArray(error.response.data[key])) {
                        errorMessages.push(`${key}: ${error.response.data[key].join(', ')}`);
                    } else if (typeof error.response.data[key] === 'string') {
                        errorMessages.push(`Error: ${error.response.data[key]}`);
                    }
                }
                setMessage(errorMessages.join('\n'));
            } else {
                setMessage('An unexpected network error occurred during registration.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 transition-colors duration-500">
            {/* Increased max-w-lg for better form field spacing */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 transition-colors duration-500">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-8">Create Your EduVision Account</h1>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                            <input
                                id="first-name"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 dark:focus:ring-purple-500 focus:border-indigo-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="John"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                            <input
                                id="last-name"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 dark:focus:ring-purple-500 focus:border-indigo-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Doe"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Email and Username */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 dark:focus:ring-purple-500 focus:border-indigo-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="john.doe@example.com"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 dark:focus:ring-purple-500 focus:border-indigo-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="johndoe123 (Must be unique)"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password and Confirm Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 dark:focus:ring-purple-500 focus:border-indigo-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Enter your password"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password2" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                            <input
                                id="password2"
                                type="password"
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
                                required
                                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 dark:focus:ring-purple-500 focus:border-indigo-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Re-enter your password"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Register as:</label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 dark:focus:ring-purple-500 focus:border-indigo-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none transition-colors duration-150"
                            disabled={isLoading}
                        >
                            <option value="student">Student</option>
                            <option value="tutor">Tutor (Instructor)</option>
                        </select>
                    </div>

                    {message && (
                        <p className={`text-sm font-medium ${message.includes('successful') ? 'text-green-500' : 'text-red-500 whitespace-pre-line'}`}>
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-indigo-600 dark:bg-purple-600 hover:bg-indigo-700 dark:hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-purple-500 transition duration-150"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Register'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-indigo-600 dark:text-purple-400 hover:text-indigo-500 dark:hover:text-purple-500 transition">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterForm;