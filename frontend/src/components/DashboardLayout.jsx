// frontend/src/components/DashboardLayout.jsx
import React from "react";
import Sidebar from "./Sidebar";
// import "../index.css"; // Assuming we want to move styles away from external CSS

const DashboardLayout = ({ user, children, theme }) => {

  // We rely on the parent (App.jsx) to set the 'dark' class on the HTML root.
  // The transition-colors duration-500 is applied globally by the theme context.

  return (
      // The main container should span the full screen minus the navbar height
      <div className="flex min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
        
        {/* Sidebar component - requires the user prop */}
        <Sidebar user={user} theme={theme} /> 
        
        {/* Main Content Area - Expands to fill remaining space */}
        <div className="dashboard-content flex-grow p-8 sm:p-10 transition-colors duration-500">
          <div className="w-full h-full">
             {children}
          </div>
        </div>
      </div>
  );
};

export default DashboardLayout;