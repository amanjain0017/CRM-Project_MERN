import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployeeLeads,
  setSearchQuery,
  setScheduleFilterType,
  clearLeadsError,
} from "../../redux/slices/leadSlice";
import "./Schedule.css";

const SchedulePage = ({ employeeId }) => {
  const dispatch = useDispatch();
  const { leads, isLoading, error, searchQuery, scheduleFilterType } =
    useSelector((state) => state.leads);

  // Filter leads to show scheduled ones and apply 'Today' filter
  const filteredScheduledLeads = leads.filter((lead) => {
    const isScheduled = lead.scheduledDate && lead.scheduledTime;
    if (!isScheduled) return false;

    if (scheduleFilterType === "Today") {
      const scheduledDate = new Date(lead.scheduledDate);
      const today = new Date();
      return scheduledDate.toDateString() === today.toDateString();
    }
    return true;
  });

  useEffect(() => {
    if (employeeId) {
      // Always fetch scheduled leads for this page
      dispatch(
        fetchEmployeeLeads({
          employeeId,
          search: searchQuery,
          isScheduledOnly: true,
        })
      );
    }
  }, [dispatch, employeeId, searchQuery]);

  // Re-fetch when filter type changes
  useEffect(() => {
    if (employeeId) {
      dispatch(
        fetchEmployeeLeads({
          employeeId,
          search: searchQuery,
          isScheduledOnly: true,
        })
      );
    }
  }, [dispatch, employeeId, searchQuery, scheduleFilterType]);

  useEffect(() => {
    dispatch(clearLeadsError());
  }, [dispatch, searchQuery, scheduleFilterType]);

  const handleSearchChange = (e) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleFilterChange = (e) => {
    dispatch(setScheduleFilterType(e.target.value));
  };

  if (isLoading && leads.length === 0) {
    return <div className="loading-screen">Loading schedule...</div>;
  }

  if (error) {
    return <div className="error-screen">Error: {error}</div>;
  }

  return (
    <div className="schedule-page-content">
      <div className="schedule-controls">
        <input
          type="text"
          placeholder="Search leads..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
        <select
          value={scheduleFilterType}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="All">All</option>
          <option value="Today">Today</option>
        </select>
      </div>

      <div className="scheduled-leads-list">
        {filteredScheduledLeads.length > 0 ? (
          filteredScheduledLeads.map((lead) => (
            <div key={lead._id} className="scheduled-lead-card">
              <h4 className="lead-name">{lead.name}</h4>
              <p className="lead-contact">Email: {lead.email || "N/A"}</p>
              <p className="lead-contact">Phone: {lead.phone || "N/A"}</p>
              <p className="lead-contact">Language: {lead.language || "N/A"}</p>
              <p className="lead-contact">Location: {lead.location || "N/A"}</p>
              <p className="lead-schedule">
                Scheduled: {new Date(lead.scheduledDate).toLocaleDateString()}{" "}
                at {lead.scheduledTime}
              </p>
            </div>
          ))
        ) : (
          <p className="no-scheduled-leads-message">
            No scheduled leads found for this filter.
          </p>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
