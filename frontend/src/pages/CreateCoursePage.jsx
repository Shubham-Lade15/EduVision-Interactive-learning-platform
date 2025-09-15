import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';

function CreateCoursePage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/api/courses/`,
                { title, description },
                {
                    headers: {
                        Authorization: `Token ${token}`
                    }
                }
            );
            setMessage('Course created successfully!');
            navigate('/courses');
        } catch (error) {
            setMessage('Failed to create course. Only tutors can perform this action.');
            console.error('Error creating course:', error.response || error);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Create a New Course</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Title:</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div>
                    <label>Description:</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                <button type="submit">Create Course</button>
                {message && <p>{message}</p>}
            </form>
        </div>
    );
}
export default CreateCoursePage;