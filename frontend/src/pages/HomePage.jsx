import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar'; // Assuming Navbar component is imported

function HomePage({ user }) {
    // --- Helper Components for Structure ---
    const Section = ({ title, children, style = {} }) => (
        <div className="py-16 px-4 md:px-8 text-center" style={style}>
            <h2 className="text-3xl font-bold mb-8">{title}</h2>
            {children}
        </div>
    );

    // --- Hero Section ---
    const HeroSection = () => (
        <div className="py-24 px-4 md:px-8 bg-gray-50 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
                EduVision: Learn Without Limits 🚀
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-10">
                The Interactive Learning Platform with AI-Generated Quizzes and Integrated Code Editor.
            </p>
            <div className="flex justify-center gap-4">
                <Link to="/courses" className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300">
                    Browse Courses
                </Link>
                <Link to="/register" className="px-6 py-3 bg-white text-indigo-600 font-semibold border-2 border-indigo-600 rounded-lg shadow-md hover:bg-indigo-50 transition duration-300">
                    Join for Free
                </Link>
            </div>
        </div>
    );
    
    // --- How It Works Section ---
    const HowItWorksSection = () => (
        <Section title="How EduVision Works">
            <div className="flex flex-col md:flex-row justify-around max-w-4xl mx-auto mt-8 gap-8">
                <Step icon="1️⃣" title="Choose a Course" description="Select from our curated catalog." />
                <Step icon="2️⃣" title="Learn & Interact" description="Watch, take mandatory in-video quizzes, and code in real-time." />
                <Step icon="3️⃣" title="Apply & Certify" description="Master skills and earn your completion certificate." />
            </div>
        </Section>
    );

    // --- Footer ---
    const Footer = () => (
        <footer className="bg-gray-800 text-white py-8 px-4 md:px-8">
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                {/* Brand */}
                <div>
                    <h4 className="text-xl font-bold mb-3">EduVision</h4>
                    <p className="text-sm text-gray-400">Learning Reimagined.</p>
                </div>
                
                {/* Quick Links */}
                <div>
                    <h4 className="text-lg font-semibold mb-3">Quick Links</h4>
                    <Link to="/about" className="block text-sm text-gray-300 hover:text-indigo-400 mb-1">About</Link>
                    <Link to="/contact" className="block text-sm text-gray-300 hover:text-indigo-400 mb-1">Contact Us</Link>
                    <Link to="/privacy" className="block text-sm text-gray-300 hover:text-indigo-400 mb-1">Privacy Policy</Link>
                </div>
                
                {/* Featured Content Placeholder */}
                <div>
                    <h4 className="text-lg font-semibold mb-3">Featured</h4>
                    <p className="text-sm text-gray-300">Trending Courses</p>
                    <p className="text-sm text-gray-300">AI Tools</p>
                </div>

                {/* Follow Us */}
                <div>
                    <h4 className="text-lg font-semibold mb-3">Follow Us</h4>
                    <div className="text-2xl space-x-3">
                        <span className="hover:text-indigo-400 transition">📘</span> 
                        <span className="hover:text-indigo-400 transition">📸</span> 
                        <span className="hover:text-indigo-400 transition">🐦</span>
                    </div>
                </div>
            </div>
            <div className="text-center text-sm text-gray-500 mt-8 border-t border-gray-700 pt-4">
                © {new Date().getFullYear()} EduVision. All rights reserved.
            </div>
        </footer>
    );

    return (
        <div className="min-h-screen flex flex-col">
            <HeroSection />

            {/* Featured Section placeholder */}
            <Section title="Featured Courses" style={{ backgroundColor: '#ffffff' }}>
                <p className="text-gray-600 mb-6">Explore our most popular and trending courses.</p>
                <Link to="/courses" className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition">
                    View All Courses
                </Link>
            </Section>

            <HowItWorksSection />
            
            {/* Testimonials Placeholder */}
            <Section title="What Our Learners Say" style={{ backgroundColor: '#f3f4f6' }}>
                <p className="text-gray-600">Testimonials will be showcased here.</p>
            </Section>

            <Footer />
        </div>
    );
}

// --- Local Helper Component for steps ---
const Step = ({ icon, title, description }) => (
    <div className="w-full md:w-1/3 p-4">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
    </div>
);

export default HomePage;