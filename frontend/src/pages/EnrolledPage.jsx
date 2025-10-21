import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function EnrolledPage() {
  const { courseName } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-blue-50">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="bg-white p-10 rounded-2xl shadow-xl text-center"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "mirror" }}
          className="text-green-500 text-5xl mb-4"
        >
          ✅
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-800">
          You are successfully enrolled for <br />
          <span className="text-indigo-600">{courseName}</span>
        </h1>
        <button
          onClick={() => navigate("/my-courses")}
          className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition"
        >
          My Enrolled Courses
        </button>
      </motion.div>
    </div>
  );
}

export default EnrolledPage;
