// src/pages/EmployeeDashboard/EmployeeDashboard.jsx
import React, { useEffect, useState } from "react"; // Import useState
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployeeDashboardData,
  employeeCheckIn,
  employeeStartBreak,
  employeeEndBreak,
  employeeFinalCheckOut,
} from "../../redux/slices/employeeDashboardSlice";

import "./EmployeeDashboardStyle.css"; // Mobile-first styling

const EmployeeDashboard = ({ employeeId, employeeProfile }) => {
  const dispatch = useDispatch();

  const { currentTiming, pastBreaks, recentActivities, isLoading, error } =
    useSelector((state) => state.employeeDashboard);

  // State for displaying success/error messages
  const [displayMessage, setDisplayMessage] = useState({ text: "", type: "" });

  // Function to get the time-based greeting for the dashboard
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good Morning";
    } else if (hour < 18) {
      return "Good Afternoon";
    } else {
      return "Good Evening";
    }
  };

  // Fetch data on mount and set up refresh interval
  useEffect(() => {
    if (employeeId) {
      dispatch(fetchEmployeeDashboardData(employeeId));
    }
    const refreshInterval = setInterval(() => {
      if (employeeId) {
        dispatch(fetchEmployeeDashboardData(employeeId));
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [dispatch, employeeId]);

  // Effect to clear messages after a few seconds
  useEffect(() => {
    if (displayMessage.text) {
      const timer = setTimeout(() => {
        setDisplayMessage({ text: "", type: "" });
      }, 3000); // Message visible for 3s
      return () => clearTimeout(timer);
    }
  }, [displayMessage.text]);

  // Helper to format time (e.g., "9:15 AM")
  const formatTime = (dateString) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper to format date (e.g., "10/04/25")
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // Helper to format activity time (e.g., "1 hour ago")
  const formatActivityTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffMinutes / (60 * 24));

    if (diffSeconds < 60)
      return `${diffSeconds} second${diffSeconds !== 1 ? "s" : ""} ago`;
    if (diffMinutes < 60)
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

    return dateString;
  };

  // Derived states for button logic based on currentTiming from Redux
  const hasCheckedInToday = !!currentTiming?.firstCheckIn; // True if firstCheckIn exists for today
  const isCurrentlyCheckedInAndWorking =
    hasCheckedInToday && !currentTiming.finalCheckOut && !currentTiming.onBreak;
  const isCurrentlyOnBreak = currentTiming.onBreak;
  const isCheckedOutForDay = !!currentTiming.finalCheckOut; // True if finalCheckOut exists for today

  // Handlers for attendance actions
  const handleCheckIn = () => {
    dispatch(employeeCheckIn(employeeId))
      .unwrap()
      .then((res) => setDisplayMessage({ text: res.message, type: "success" }))
      .catch((err) =>
        setDisplayMessage({ text: `Error: ${err}`, type: "error" })
      );
  };

  const handleStartBreak = () => {
    dispatch(employeeStartBreak(employeeId))
      .unwrap()
      .then((res) => setDisplayMessage({ text: res.message, type: "success" }))
      .catch((err) =>
        setDisplayMessage({ text: `Error: ${err}`, type: "error" })
      );
  };

  const handleEndBreak = () => {
    dispatch(employeeEndBreak(employeeId))
      .unwrap()
      .then((res) => setDisplayMessage({ text: res.message, type: "success" }))
      .catch((err) =>
        setDisplayMessage({ text: `Error: ${err}`, type: "error" })
      );
  };

  const handleFinalCheckOut = () => {
    dispatch(employeeFinalCheckOut(employeeId))
      .unwrap()
      .then((res) => setDisplayMessage({ text: res.message, type: "success" }))
      .catch((err) =>
        setDisplayMessage({ text: `Error: ${err}`, type: "error" })
      );
  };

  if (isLoading && !employeeProfile && !currentTiming.firstCheckIn) {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-screen">Error: {error}</div>;
  }

  return (
    <div className="employee-dashboard-content">
      {/* Message Display Area */}
      {displayMessage.text && (
        <div className={`app-message ${displayMessage.type}`}>
          {displayMessage.text}
        </div>
      )}

      {/* Attendance Action Buttons */}
      <div className="attendance-actions">
        <button
          onClick={handleCheckIn}
          // Enabled if: Not checked in today OR (checked in but checked out for day) OR (checked in and on break - to resume work)
          // Disabled if: Currently checked in AND working AND NOT checked out for day AND NOT on break
          // disabled={
          //   isCurrentlyCheckedInAndWorking ||
          //   isCurrentlyOnBreak ||
          //   isCheckedOutForDay
          // }
          className="action-button check-in-button"
        >
          Check In
        </button>
        <button
          onClick={handleStartBreak}
          // Enabled only if: Currently checked in AND working
          // disabled={
          //   !isCurrentlyCheckedInAndWorking ||
          //   isCurrentlyOnBreak ||
          //   isCheckedOutForDay
          // }
          className="action-button break-button"
        >
          Start Break
        </button>
        <button
          onClick={handleEndBreak}
          // Enabled only if: Currently on break
          // disabled={!isCurrentlyOnBreak || isCheckedOutForDay}
          className="action-button end-break-button"
        >
          End Break
        </button>
        <button
          onClick={handleFinalCheckOut}
          // Enabled only if: Currently checked in AND working
          // disabled={
          //   !isCurrentlyCheckedInAndWorking ||
          //   isCurrentlyOnBreak ||
          //   isCheckedOutForDay
          // }
          className="action-button check-out-button"
        >
          Check Out
        </button>
      </div>

      {/* Timings Section */}
      <div className="timings-section">
        {/* Check-in / Check-out display card */}
        <div className="timing-card online-status">
          <div className="timing-label">Checked in to Canova Platform :</div>
          <div
            id="online"
            className={`status-indicator ${
              currentTiming.isActive ? "status-green" : "status-red"
            }`}
          ></div>
        </div>

        {/* Break display card */}
        <div className="timing-card break-card">
          <div className="timing-label">Break</div>
          <div className="timing-value">
            {formatTime(currentTiming?.breakStartTime)}
          </div>
          <div className="timing-label">Ended</div>
          {/* Only show end time if break is actually ended. If on break, show '---' */}
          <div className="timing-value">
            {currentTiming.onBreak
              ? "---"
              : formatTime(currentTiming?.breakEndTime)}
          </div>
          <div
            className={`status-indicator ${
              isCurrentlyOnBreak ? "status-red" : "status-gray"
            }`}
          ></div>
        </div>

        {/* Past Break Records */}
        <div className="past-breaks-list">
          <h4 className="list-title">Past Breaks</h4>
          {pastBreaks.length > 0 ? (
            pastBreaks.map((b, index) => (
              <div className="past-break-item" key={index}>
                <span className="break-time-label">Start</span>
                <span className="break-time-value">
                  {formatTime(b.breakStart)}
                </span>
                <span className="break-time-label">End</span>
                <span className="break-time-value">
                  {formatTime(b.breakEnd)}
                </span>
                <span className="break-date-label">Date</span>
                <span className="break-date-value">
                  {formatDate(b.date)}
                </span>{" "}
                {/* Use the date from the attendance record */}
              </div>
            ))
          ) : (
            <p className="no-records-message">No past break records.</p>
          )}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="recent-activity-section">
        <h3 className="section-title">Recent Activity</h3>
        <div className="activity-feed-list">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <div className="activity-feed-item" key={index}>
                <p className="activity-text">{activity.activity}</p>
                <span className="activity-time">{activity.timestamp}</span>
              </div>
            ))
          ) : (
            <p className="no-records-message">No recent activities.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
