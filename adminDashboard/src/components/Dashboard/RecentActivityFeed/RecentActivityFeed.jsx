import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRecentActivities } from "../../../redux/slices/dashboardSlice";
import "./RecentActivityFeedStyle.css";

const ActivityItem = ({ text, time }) => (
  <div className="activity-item">
    <p className="activity-text">{text}</p>
    <span className="activity-time">{time}</span>
  </div>
);

const RecentActivityFeed = () => {
  const dispatch = useDispatch();
  const { recentActivities, isLoading, error } = useSelector(
    (state) => state.dashboard
  );

  useEffect(() => {
    dispatch(fetchRecentActivities());
  }, [dispatch]);

  // Helper to format time ("5 minutes ago", "Yesterday at 10:30 AM")
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

  if (isLoading && recentActivities.length === 0) {
    return (
      <div className="recent-activity-feed-container">
        <h3 className="dashboard-section-title">Recent Activity</h3>
        <div className="activity-list">
          <p className="loading-message">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error && recentActivities.length === 0) {
    return (
      <div className="recent-activity-feed-container">
        <h3 className="dashboard-section-title">Recent Activity</h3>
        <div className="activity-list error-message">
          <p>Error loading activities: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-activity-feed-container">
      <h3 className="dashboard-section-title">Recent Activity</h3>
      <div className="activity-list">
        {recentActivities.length > 0 ? (
          recentActivities.map((activity, index) => (
            <ActivityItem
              key={activity.leadId || index} //leadId if available, else index
              text={activity.activity}
              time={formatTimeAgo(activity.timestamp)}
            />
          ))
        ) : (
          <p className="no-activities-message">No recent activities.</p>
        )}
      </div>
    </div>
  );
};

export default RecentActivityFeed;
