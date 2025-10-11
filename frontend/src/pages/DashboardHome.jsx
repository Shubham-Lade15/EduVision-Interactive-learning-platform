import React from "react";
import DashboardLayout from "../components/DashboardLayout";

const DashboardHome = ({ user }) => {
  return (
    <DashboardLayout user={user}>
      <h1 className="dashboard-header">Welcome back, {user?.name || "Learner"} 👋</h1>
      <p style={{ fontSize: "1.1em", color: "gray", marginBottom: "20px" }}>
        Here’s a quick look at your learning progress.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px"
      }}>
        <div style={{
          background: "linear-gradient(120deg, #007bff, #00bcd4)",
          borderRadius: "12px",
          padding: "25px",
          color: "#fff",
          boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
        }}>
          <h3>Enrolled Courses</h3>
          <h1>5</h1>
        </div>

        <div style={{
          background: "linear-gradient(120deg, #6c63ff, #00bcd4)",
          borderRadius: "12px",
          padding: "25px",
          color: "#fff",
          boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
        }}>
          <h3>Completed Lessons</h3>
          <h1>23</h1>
        </div>

        <div style={{
          background: "linear-gradient(120deg, #ff6b6b, #f06595)",
          borderRadius: "12px",
          padding: "25px",
          color: "#fff",
          boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
        }}>
          <h3>Achievements</h3>
          <h1>3</h1>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
