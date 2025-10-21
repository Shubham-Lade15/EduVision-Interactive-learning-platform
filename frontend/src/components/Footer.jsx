import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, Linkedin, Twitter, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] dark:from-[#0f0f0f] dark:to-[#1a1a1a] border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-10 text-gray-700 dark:text-gray-300">
        
        {/* Brand Info */}
        <div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent mb-3">
            EduVision
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Transforming passive learning into active, AI-driven education.  
            Learn, engage, and apply in “The Unscripted Classroom.”
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-indigo-600 dark:text-indigo-400">
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-indigo-500 transition">Home</Link></li>
            <li><Link to="/about" className="hover:text-indigo-500 transition">About</Link></li>
            <li><Link to="/contact" className="hover:text-indigo-500 transition">Contact</Link></li>
            <li><Link to="/courses" className="hover:text-indigo-500 transition">Courses</Link></li>
            <li><Link to="/my-courses" className="hover:text-indigo-500 transition">My Learning</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-indigo-600 dark:text-indigo-400">
            Support
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-500" />
              <a href="mailto:shubhamlade495@gmail.com" className="hover:text-indigo-500 transition">
                shubhamlade495@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-500" />
              <span>+91 7030526281</span>
            </li>
            <li><Link to="/register" className="hover:text-indigo-500 transition">Register as Tutor</Link></li>
          </ul>
        </div>

        {/* Follow Us */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-indigo-600 dark:text-indigo-400">
            Follow Us
          </h3>
          <div className="flex gap-4">
            <a
              href="https://www.linkedin.com/in/shubham-lade-263b98265/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400"
            >
              <Linkedin className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400"
            >
              <Twitter className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400"
            >
              <Facebook className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-300 dark:border-gray-800 text-center text-sm py-4 text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} <span className="font-semibold text-indigo-600 dark:text-indigo-400">EduVision</span>.  
        All rights reserved. | Designed by Team EduVision ✨
      </div>
    </footer>
  );
};

export default Footer;
