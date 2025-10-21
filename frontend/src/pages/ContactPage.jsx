import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook } from "lucide-react";
import { Link } from "react-router-dom";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2f7] dark:from-[#0f0f0f] dark:to-[#1a1a1a] text-gray-900 dark:text-gray-100 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto space-y-12"
      >
        {/* HEADER */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
            Get in Touch with EduVision
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto">
            We're here to help you get started on your active learning journey or explore partnership opportunities.  
            Choose the option that best fits your needs.
          </p>
        </div>

        {/* GENERAL SUPPORT */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
        >
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-3">
            💬 General Support & Inquiries (Students & Users)
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            If you have questions about a course, technical issues, enrollment, or login problems, please reach out to our dedicated support team.
          </p>

          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-indigo-500" />
              <span>
                <strong>Email:</strong> <a href="mailto:shubhamlade495@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">shubhamlade495@gmail.com</a> (for fastest response)
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-indigo-500" />
              <span>
                <strong>Phone:</strong> +91 7030526281 <em>(India - 9:00 AM to 5:00 PM IST)</em>
              </span>
            </li>
            <li>
              <strong>FAQ/Help Center:</strong> Coming soon!  
              <span className="text-gray-500 text-sm ml-1">(Future Help Page)</span>
            </li>
          </ul>
        </motion.section>

        {/* PARTNERSHIP */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
        >
          <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400 mb-3">
            🤝 Partnership & Business Inquiries (Tutors & Institutions)
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            For matters related to becoming an instructor, content licensing, institutional partnerships, or business development, please contact our administrative office.
          </p>

          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-sky-500" />
              <span>
                <strong>Email:</strong> <a href="mailto:zademugdha64@gmail.com" className="text-sky-600 dark:text-sky-400 hover:underline">zademugdha64@gmail.com</a>
              </span>
            </li>
            <li>
              <strong>Tutor Registration:</strong>{" "}
              <Link to="/register" className="text-sky-600 dark:text-sky-400 hover:underline">
                Click here to register as a tutor →
              </Link>
            </li>
          </ul>
        </motion.section>

        {/* OFFICE */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
        >
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-3">
            🏢 Head Office (Mailing Address)
          </h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>📍 <strong>EduVision Interactive Learning Platform</strong></li>
            <li>G.H. Raisoni College of Engineering, Nagpur, India</li>
            <li><em>(Official correspondence only)</em></li>
          </ul>
        </motion.section>

        {/* SOCIAL MEDIA */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
        >
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
            🌐 Follow Our Journey
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Stay updated with new courses, features, and educational technology trends by following us on social media:
          </p>

          <div className="flex justify-center gap-6">
            <a
              href="https://www.linkedin.com/in/shubham-lade-263b98265/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400"
            >
              <Linkedin className="w-7 h-7" />
            </a>
            <a
              href="#"
              className="hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400"
            >
              <Twitter className="w-7 h-7" />
            </a>
            <a
              href="#"
              className="hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400"
            >
              <Facebook className="w-7 h-7" />
            </a>
          </div>
        </motion.section>

        {/* FOOTER */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12 text-gray-500 dark:text-gray-400 italic"
        >
          We look forward to hearing from you!  
          <br />
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
            — Team EduVision
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ContactPage;
