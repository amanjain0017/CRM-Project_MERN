import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployeeDashboardData,
  employeeCheckIn,
  employeeStartBreak,
  employeeEndBreak,
  employeeFinalCheckOut,
} from "../../redux/slices/employeeDashboardSlice";

import { logoutEmployee } from "../../redux/slices/authSlice";

import "./EmployeeDashboardStyle.css";

const EmployeeDashboard = ({ employeeId, employeeProfile }) => {
  const dispatch = useDispatch();

  const { currentTiming, pastBreaks, recentActivities, isLoading, error } =
    useSelector((state) => state.employeeDashboard);

  // State for displaying success/error messages
  const [displayMessage, setDisplayMessage] = useState({ text: "", type: "" });

  // Fetch data on mount or change
  useEffect(() => {
    if (employeeId) {
      dispatch(fetchEmployeeDashboardData(employeeId));
    }
  }, [dispatch, employeeId]);

  // Effect to clear messages after a few seconds
  useEffect(() => {
    if (displayMessage.text) {
      const timer = setTimeout(() => {
        setDisplayMessage({ text: "", type: "" });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [displayMessage.text]);

  // Helper to format time (e.g., "9:15 AM")
  const formatTime = (dateString) => {
    if (!dateString) return "";
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

  // Helper to format time ("5 minutes ago"")
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60)
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    // Fallback to local date string=
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Derived states for button logic based on currentTiming from Redux
  const hasCheckedInToday = !!currentTiming?.checkIn;
  const hasCheckedOutForDay = !!currentTiming?.checkOut;
  const isCurrentlyOnBreak = currentTiming?.onBreak;
  const isCurrentlyCheckedInAndWorking =
    hasCheckedInToday && !hasCheckedOutForDay && !isCurrentlyOnBreak;

  // Handlers for attendance actions
  const handleCheckIn = () => {
    dispatch(employeeCheckIn(employeeId))
      .unwrap()
      .then((res) => {
        setDisplayMessage({ text: res.message, type: "success" });
        dispatch(fetchEmployeeDashboardData(employeeId));
      })
      .catch((err) =>
        setDisplayMessage({ text: `Error: ${err}`, type: "error" })
      );
  };

  const handleStartBreak = () => {
    dispatch(employeeStartBreak(employeeId))
      .unwrap()
      .then((res) => {
        setDisplayMessage({ text: res.message, type: "success" });
        dispatch(fetchEmployeeDashboardData(employeeId));
      })
      .catch((err) =>
        setDisplayMessage({ text: `Error: ${err}`, type: "error" })
      );
  };

  const handleEndBreak = () => {
    dispatch(employeeEndBreak(employeeId))
      .unwrap()
      .then((res) => {
        setDisplayMessage({ text: res.message, type: "success" });
        dispatch(fetchEmployeeDashboardData(employeeId));
      })
      .catch((err) =>
        setDisplayMessage({ text: `Error: ${err}`, type: "error" })
      );
  };

  const handleFinalCheckOut = () => {
    dispatch(employeeFinalCheckOut(employeeId))
      .unwrap()
      .then((res) => {
        setDisplayMessage({ text: res.message, type: "success" });
        dispatch(fetchEmployeeDashboardData(employeeId));

        dispatch(logoutEmployee());
      })
      .catch((err) =>
        setDisplayMessage({ text: `Error: ${err}`, type: "error" })
      );
  };

  if (isLoading && !employeeProfile && !currentTiming.checkIn) {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  if (error) {
    if (error.toLowerCase().includes("employee not found")) {
      dispatch(logoutEmployee());
    }

    return <div className="error-screen">Error: {error}</div>;
  }

  return (
    <div className="employee-dashboard-content">
      {/* Message Display Area */}
      <div className="message-display-section">
        {displayMessage.text && (
          <div className={`app-message ${displayMessage.type}`}>
            {displayMessage.text}
          </div>
        )}
      </div>

      {/* Attendance Action Buttons */}
      <div className="attendance-actions">
        <button
          onClick={handleCheckIn}
          disabled={hasCheckedInToday}
          className="action-button check-in-button"
        >
          Check In
        </button>

        <button
          onClick={handleStartBreak}
          disabled={!isCurrentlyCheckedInAndWorking}
          className="action-button break-button"
        >
          Start Break
        </button>

        <button
          onClick={handleEndBreak}
          disabled={!isCurrentlyOnBreak}
          className="action-button end-break-button"
        >
          End Break
        </button>

        <button
          onClick={handleFinalCheckOut}
          disabled={!isCurrentlyCheckedInAndWorking}
          className="action-button check-out-button"
        >
          Check Out
        </button>
      </div>

      {/* Timings Section */}
      <div className="timings-section">
        {/* Check-in / Check-out display card */}
        <div className="timing-card checkedin-card">
          <div className="timing-label">Check-in :</div>
          <div className="timing-value">
            {formatTime(currentTiming?.checkIn)}
          </div>

          <div className="timing-label">Check-out :</div>
          <div className="timing-value">
            {formatTime(currentTiming?.checkOut)}
          </div>

          <div
            className={`status-indicator ${
              currentTiming?.isActive ? "status-green" : "status-red"
            }`}
          ></div>
        </div>

        {/* Break display card */}
        <div className="timing-card break-card">
          <div className="timing-label">Break :</div>
          <div className="timing-value">
            {formatTime(currentTiming?.breakStartTime)}
          </div>
          <div className="timing-label">Ended :</div>
          <div className="timing-value">
            {currentTiming.onBreak
              ? "(on a break)"
              : formatTime(currentTiming?.breakEndTime)}
          </div>
          <div
            className={`status-indicator ${
              isCurrentlyOnBreak ? "status-green" : "status-gray"
            }`}
          ></div>
        </div>

        {/* Past Break Records */}
        <div className="break-section">
          <h4 className="list-title">Past Breaks</h4>
          <div className="past-breaks-list">
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
      </div>

      {/* Recent Activity Section */}
      <div className="recent-activity-section">
        <h3 className="section-title">Recent Activity</h3>
        <div className="activity-feed-list">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <div className="activity-feed-item" key={index}>
                <p className="activity-text">{activity.activity}</p>
                <div className="activity-time">
                  {formatTimeAgo(activity.timestamp)}
                </div>
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
