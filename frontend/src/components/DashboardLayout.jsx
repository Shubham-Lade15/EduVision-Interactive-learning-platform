import React from "react";
import Sidebar from "./Sidebar";
import "../index.css";

const DashboardLayout = ({ user, children }) => {
  return (
      <div className="dashboard-container">
        <Sidebar user={user} />
        <div className="dashboard-content fade-in">{children}</div>
      </div>
  );
};

export default DashboardLayout;
