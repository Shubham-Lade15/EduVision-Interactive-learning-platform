// frontend/src/pages/CourseDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ReactPlayer from 'react-player';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Base URL for the API

function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [segmentationStatus, setSegmentationStatus] = useState('');

  // useEffect hook to fetch course details when the page loads or courseId changes
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/`);
        setCourse(response.data);
        if (response.data.videos && response.data.videos.length > 0) {
          setCurrentVideoUrl(response.data.videos[0].video_file);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch course details. Please check the backend API.');
        setLoading(false);
        console.error("Error fetching course details:", err);
      }
    };
    fetchCourseDetails();
  }, [courseId]);

  // Handler for selecting a video to play
  const handleVideoSelect = (videoFile) => {
    const isFullUrl = videoFile.startsWith('http://') || videoFile.startsWith('https://');
    const fullUrl = isFullUrl ? videoFile : `${API_BASE_URL}${videoFile}`;
    
    console.log("URL passed to ReactPlayer:", fullUrl);
    setCurrentVideoUrl(fullUrl);
  };

  // Handler for triggering transcription
  const handleTranscribe = async (videoId) => {
    setTranscriptionStatus('Transcription started...');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/videos/${videoId}/transcribe/`);
      setTranscriptionStatus(response.data.status);
    } catch (error) {
      setTranscriptionStatus('Transcription failed!');
      console.error('Error during transcription:', error);
    }
  };

  // Handler for triggering segmentation
  const handleSegment = async (videoId) => {
    setSegmentationStatus('Segmentation started...');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/videos/${videoId}/segment/`);
      setSegmentationStatus(response.data.status);
    } catch (error) {
      setSegmentationStatus('Segmentation failed!');
      console.error('Error during segmentation:', error);
    }
  };

  if (loading) return <div>Loading course details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!course) return <div>Course not found.</div>;

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>{course.title}</h1>
      <p>{course.description}</p>

      <div style={{ width: '80%', marginBottom: '20px' }}>
        {currentVideoUrl ? (
          <video 
            key={currentVideoUrl}
            src={currentVideoUrl}
            controls
            width="100%"
        />
        ) : (
          <div>No video selected or available for this course.</div>
        )}
      </div>

      <h2>Course Videos</h2>
      <div style={{ width: '80%', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
        {course.videos.length > 0 ? (
          <ul>
            {course.videos.map(video => (
              <li key={video.id} style={{ marginBottom: '10px' }}>
                <span 
                    style={{ cursor: 'pointer', color: currentVideoUrl.includes(video.video_file) ? 'blue' : 'black' }} 
                    onClick={() => handleVideoSelect(video.video_file)}> 
                  {video.title}
                </span>
                <button
                    onClick={() => handleTranscribe(video.id)}
                    style={{ marginLeft: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
                >
                    Transcribe
                </button>
                {transcriptionStatus && video.id === video.id && <span style={{ marginLeft: '10px' }}>{transcriptionStatus}</span>}
                <button
                    onClick={() => handleSegment(video.id)}
                    style={{ marginLeft: '10px', backgroundColor: '#3366ff', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
                >
                    Segment
                </button>
                {segmentationStatus && video.id === video.id && <span style={{ marginLeft: '10px' }}>{segmentationStatus}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No videos uploaded for this course yet.</p>
        )}
      </div>
    </div>
  );
}

export default CourseDetailPage;