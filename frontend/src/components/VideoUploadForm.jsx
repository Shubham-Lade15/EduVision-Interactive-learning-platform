import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';

function VideoUploadForm() {
    const [videoFile, setVideoFile] = useState(null);
    const [title, setTitle] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [courses, setCourses] = useState([]);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/courses/`);
                setCourses(response.data);
            } catch (error) {
                setMessage('Failed to fetch courses. Please try again later.');
                console.error('Error fetching courses:', error.response || error);
            }
        };
        fetchCourses();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('course', selectedCourse);
        formData.append('video_file', videoFile);

        // --- inside handleSubmit ---
        try {
            const token = localStorage.getItem('token');

            // IMPORTANT: do NOT set Content-Type manually for multipart/form-data.
            const config = {
                headers: {}
            };
            if (token) config.headers.Authorization = `Token ${token}`;

            const response = await axios.post(
                `${API_BASE_URL}/api/videos/upload/`,
                formData,
                config
            );

            setMessage('Video uploaded successfully!');
            navigate('/courses');
        } catch (error) {
            setMessage('Failed to upload video. Please ensure you are a tutor.');
            console.error('Error uploading video:', error.response || error);
        }
      }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Upload a New Video</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Video Title:</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div>
                    <label>Select Course:</label>
                    <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} required>
                        <option value="">--Select a Course--</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Choose Video File:</label>
                    <input type="file" onChange={(e) => setVideoFile(e.target.files[0])} required />
                </div>
                <button type="submit">Upload Video</button>
                {message && <p>{message}</p>}
            </form>
        </div>
    );
}
export default VideoUploadForm;