import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployeeLeads,
  setScheduleFilterType,
  clearLeadsError,
} from "../../redux/slices/leadSlice";
import "./Schedule.css";

const SchedulePage = ({ employeeId }) => {
  const dispatch = useDispatch();
  const { leads, error, scheduleFilterType } = useSelector(
    (state) => state.leads
  );

  //for managning local search bar
  const [localSearch, setLocalSearch] = useState("");

  //deriving scheduled type
  // const [derivedScheduledType, setDerivedScheduledType] = useState("");

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

  const deriveScheduledType = (lead) => {
    if (!lead.email) {
      return "Cold Call";
    } else if (!lead.phone) {
      return "Referral";
    } else if (lead.leadType === "Cold Call") {
      return "Cold Call";
    } else {
      return "Referral";
    }
  };

  useEffect(() => {
    if (employeeId) {
      // Always fetch scheduled leads for this page
      dispatch(
        fetchEmployeeLeads({
          employeeId,
          search: localSearch,
          isScheduledOnly: true,
        })
      );
    }
  }, [dispatch, employeeId, localSearch, scheduleFilterType]);

  useEffect(() => {
    dispatch(clearLeadsError());
  }, [dispatch, scheduleFilterType]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
  };

  const handleFilterChange = (e) => {
    dispatch(setScheduleFilterType(e.target.value));
  };

  if (error) {
    return <div className="error-screen">Error: {error}</div>;
  }

  return (
    <div className="schedule-page-content">
      <div className="schedule-controls">
        <input
          type="text"
          placeholder="Search leads..."
          value={localSearch}
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
              <h4 className="lead-name">{deriveScheduledType(lead)}</h4>
              <p className="lead-contact">Name: {lead.name || "N/A"}</p>
              {lead.email ? (
                <p className="lead-contact">Email: {lead.email}</p>
              ) : (
                ""
              )}
              {lead.phone ? (
                <p className="lead-contact">Phone: {lead.phone}</p>
              ) : (
                ""
              )}
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
            No scheduled leads found.
          </p>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
