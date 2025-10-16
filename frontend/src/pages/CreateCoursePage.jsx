import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';

function CreateCoursePage() {
    // Existing fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    
    // NEW STATE FIELDS
    const [shortDescription, setShortDescription] = useState('');
    const [language, setLanguage] = useState('English');
    const [durationHours, setDurationHours] = useState('');
    
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const commonLanguages = ["English", "Spanish", "French", "German", "Python", "SQL"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Token ${token}`
                }
            };
            
            // Collect all data for the payload
            const payload = {
                title, 
                description,
                short_description: shortDescription, // New field
                language,                           // New field
                duration_hours: durationHours,       // New field
                is_published: false,                 // Default to Draft until reviewed/ready
                // 'tutor' field is injected by the backend (perform_create)
            };

            const response = await axios.post(
                `${API_BASE_URL}/api/courses/`,
                payload, // Use the expanded payload
                config
            );
            setMessage('Course created successfully!');
            navigate('/courses');
        } catch (error) {
            setMessage('Failed to create course. Only tutors can perform this action.');
            console.error('Error creating course:', error.response || error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
            <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
                <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6">Create a New Course</h1>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., Data Structures: Linked Lists"
                        />
                    </div>
                    
                    {/* Short Description */}
                    <div>
                        <label htmlFor="short-desc" className="block text-sm font-medium text-gray-700 mb-1">Short Tagline (Max 500 chars)</label>
                        <input
                            id="short-desc"
                            type="text"
                            value={shortDescription}
                            onChange={(e) => setShortDescription(e.target.value)}
                            maxLength="500"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="A concise summary for the catalog page"
                        />
                    </div>

                    {/* Language and Duration (Side-by-Side) */}
                    <div className="grid grid-cols-2 gap-4">
                        
                        {/* Language */}
                        <div>
                            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Course Language</label>
                            <select
                                id="language"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            >
                                {commonLanguages.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Duration */}
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Total Duration (Hours)</label>
                            <input
                                id="duration"
                                type="number"
                                step="0.1"
                                value={durationHours}
                                onChange={(e) => setDurationHours(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g., 12.5"
                            />
                        </div>
                    </div>

                    {/* Description (Full) */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Full Course Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="4"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Detail what the course covers, module-by-module..."
                        />
                    </div>
                    
                    {/* What Will You Learn (Placeholder/Future Implementation) */}
                    {/* In a production app, this would be a separate form or JSON field */}
                    <div className="text-sm text-gray-500 p-2 border-l-4 border-indigo-500 bg-indigo-50">
                        *Note: What You'll Learn (Outcomes) will be managed/parsed from the Description in a future iteration.*
                    </div>
                    
                    {message && <p className={`text-sm font-medium ${message.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
                    
                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                    >
                        Create & Save Draft
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateCoursePage;