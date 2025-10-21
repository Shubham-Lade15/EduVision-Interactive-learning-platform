// src/components/CourseCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
  const [hovered, setHovered] = useState(false);

  // Re-implemented styles using Tailwind classes for aesthetics and dark mode
  
  const cardClasses = `
    w-full max-w-sm
    rounded-xl overflow-hidden
    shadow-lg dark:shadow-purple-900/40
    border border-gray-200 dark:border-gray-700
    bg-white dark:bg-gray-800
    transition-all duration-300 ease-in-out
    ${hovered ? 'scale-[1.03] shadow-2xl' : 'scale-100'}
  `;

  const gradientClasses = `
    p-6 min-h-[180px]
    flex flex-col justify-between
    text-white
    
    // Dynamic Gradient for aesthetic hover effect
    bg-gradient-to-br from-indigo-600 to-purple-600
    dark:from-indigo-800 dark:to-purple-900
    transition-all duration-500 ease-in-out
    ${hovered ? 'from-indigo-700 to-purple-700' : ''}
  `;

  const titleClasses = "text-2xl font-bold mb-2";
  const descClasses = "flex-grow text-sm mb-4 text-indigo-100 dark:text-purple-200";

  const linkClasses = `
    self-start py-2 px-4
    text-sm font-semibold
    rounded-lg shadow-md
    text-white
    bg-indigo-700 dark:bg-purple-700
    hover:bg-indigo-800 dark:hover:bg-purple-800
    transition duration-300 ease-in-out
  `;

  // Determine enrollment status/progress display (if available on the object)
  const isEnrolled = course.progress !== undefined;
  const progressPercent = course.progress || 0; // Assuming progress field if available

  return (
    <div
      className={cardClasses}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/courses/${course.id}`} className="block">
        <div className={gradientClasses}>
          <h3 className={titleClasses}>{course.title}</h3>
          <p className={descClasses}>{course.short_description || course.description}</p>
        </div>

        {/* Footer for Metadata/Progress */}
        <div className="p-4 space-y-2 text-gray-700 dark:text-gray-300">
            <div className="flex justify-between text-sm">
                <span className="font-medium">Tutor: {course.tutor_username || 'Instructor'}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${course.is_published ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'}`}>
                    {course.is_published ? 'Published' : 'Draft'}
                </span>
            </div>

            {isEnrolled && (
                <div className="pt-2">
                    <p className="text-xs font-semibold mb-1">Progress: {progressPercent}%</p>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                            style={{ width: `${progressPercent}%` }}
                            className="h-full bg-green-500 dark:bg-green-600 rounded-full transition-all duration-500"
                        />
                    </div>
                </div>
            )}

            <Link
              to={`/courses/${course.id}`}
              className={linkClasses + ' mt-4 text-center w-full'}
              onClick={(e) => e.stopPropagation()} // Prevent double link navigation
            >
              {isEnrolled ? 'Resume Course' : 'View Details'}
            </Link>
        </div>
      </Link>
    </div>
  );
};

export default CourseCard;