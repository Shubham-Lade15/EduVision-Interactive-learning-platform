import React from "react";
import { Link } from "react-router-dom";
import { Home, Book, User, LogOut } from "lucide-react";

const Sidebar = ({ isOpen, darkMode }) => {
  return (
    <aside
      className={`fixed md:static top-0 left-0 h-full md:h-auto w-64 bg-gray-100 dark:bg-gray-800 shadow-lg transform transition-transform duration-300 
      ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 z-40`}
    >
      <div className="flex flex-col p-4 space-y-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition"
        >
          <Home className="w-5 h-5" /> Dashboard
        </Link>
        <Link
          to="/courses"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition"
        >
          <Book className="w-5 h-5" /> Courses
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition"
        >
          <User className="w-5 h-5" /> Profile
        </Link>
        <button className="flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-red-500 hover:text-white transition">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
