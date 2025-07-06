import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployeeLeads,
  updateLead,
  setFilterStatus,
  clearLeadsError,
} from "../../redux/slices/leadSlice";
import "./Leads.css";

const LeadsPage = ({ employeeId }) => {
  const dispatch = useDispatch();
  const { leads, error, filterStatus } = useSelector((state) => state.leads);

  //for managning local search bar
  const [localSearch, setLocalSearch] = useState("");

  // managing inline dropdowns/popovers
  const [activeUpdateDropdownId, setActiveUpdateDropdownId] = useState(null);
  const [activeScheduleDropdownId, setActiveScheduleDropdownId] =
    useState(null);

  // update form
  const [currentLeadType, setCurrentLeadType] = useState("");
  const [currentLeadStatus, setCurrentLeadStatus] = useState("");

  // schedule form
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  //display success/error messages
  const [displayMessage, setDisplayMessage] = useState({ text: "", type: "" });

  // Refs to handle clicks outside
  const updateDropdownRef = useRef(null);
  const scheduleDropdownRef = useRef(null);

  //make message disappear
  useEffect(() => {
    if (displayMessage.text) {
      const timer = setTimeout(() => {
        setDisplayMessage({ text: "", type: "" });
      }, 2000); // hide after 2s
      return () => clearTimeout(timer);
    }
  }, [displayMessage.text]);

  // Fetch leads when component mounts or filters/search change
  useEffect(() => {
    if (employeeId) {
      dispatch(
        fetchEmployeeLeads({
          employeeId,
          search: localSearch,
          status: filterStatus,
        })
      );
    }
  }, [dispatch, employeeId, localSearch, filterStatus]);

  // Clear error when component mounts or search/filter changes
  useEffect(() => {
    dispatch(clearLeadsError());
  }, [dispatch, filterStatus]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        updateDropdownRef.current &&
        !updateDropdownRef.current.contains(event.target)
      ) {
        setActiveUpdateDropdownId(null);
      }
      if (
        scheduleDropdownRef.current &&
        !scheduleDropdownRef.current.contains(event.target)
      ) {
        setActiveScheduleDropdownId(null);
        resetScheduleForm();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
  };

  const handleFilterChange = (e) => {
    dispatch(setFilterStatus(e.target.value));
  };

  // Update Lead Dropdown Logic
  const toggleUpdateDropdown = (lead) => {
    if (activeUpdateDropdownId === lead._id) {
      setActiveUpdateDropdownId(null);
    } else {
      setActiveUpdateDropdownId(lead._id);
      setCurrentLeadType(lead.leadType);
      setCurrentLeadStatus(lead.status);
      setActiveScheduleDropdownId(null);
    }
  };

  const handleUpdateSave = (leadId) => {
    const updateData = {};
    const selectedLead = leads.find((l) => l._id === leadId);

    if (
      currentLeadStatus === "Closed" &&
      selectedLead.scheduledDate &&
      selectedLead.scheduledTime
    ) {
      const scheduledDateTime = new Date(selectedLead.scheduledDate);
      const [hours, minutes] = selectedLead.scheduledTime
        .split(":")
        .map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      if (scheduledDateTime.getTime() > now.getTime()) {
        setDisplayMessage({
          text: "Cannot close lead with a future scheduled activity.",
          type: "error",
        });
        return;
      }
    }

    if (currentLeadType !== selectedLead.leadType) {
      updateData.leadType = currentLeadType;
    }
    if (currentLeadStatus !== selectedLead.status) {
      updateData.status = currentLeadStatus;
    }

    if (Object.keys(updateData).length > 0) {
      dispatch(updateLead({ leadId, updateData }))
        .unwrap()
        .then(() => {
          setDisplayMessage({
            text: "Lead updated successfully.",
            type: "success",
          });
          setActiveUpdateDropdownId(null);
          dispatch(fetchEmployeeLeads({ employeeId, status: filterStatus }));
        })
        .catch((err) => {
          setDisplayMessage({
            text: `Failed to update lead: ${err}`,
            type: "error",
          });
        });
    } else {
      setDisplayMessage({ text: "No changes to update.", type: "error" });
      setActiveUpdateDropdownId(null);
    }
  };

  // Schedule Activity Dropdown Logic
  const toggleScheduleDropdown = (lead) => {
    if (activeScheduleDropdownId === lead._id) {
      setActiveScheduleDropdownId(null);
      resetScheduleForm();
    } else {
      setActiveScheduleDropdownId(lead._id);
      setActiveUpdateDropdownId(null);

      // Initialize schedule form with current lead's schedule if exists
      const date = lead.scheduledDate ? new Date(lead.scheduledDate) : null;
      setScheduleDate(date ? date.toISOString().split("T")[0] : "");
      setScheduleTime(lead.scheduledTime || "");
    }
  };

  const resetScheduleForm = () => {
    setScheduleDate("");
    setScheduleTime("");
  };

  const handleScheduleSave = (leadId) => {
    if (!scheduleDate || !scheduleTime) {
      setDisplayMessage({
        text: "Please select both a future date and time.",
        type: "error",
      });
      return;
    }

    const selectedDateObj = new Date(scheduleDate);
    const [hours, minutes] = scheduleTime.split(":").map(Number);
    selectedDateObj.setHours(hours, minutes, 0, 0);

    // Ensure date is not in the past (only date part check, time can be earlier today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (
      selectedDateObj < today &&
      selectedDateObj.toDateString() !== today.toDateString()
    ) {
      setDisplayMessage({
        text: "Scheduled date cannot be in the past.",
        type: "error",
      });
      return;
    }
    // If it's today, ensure time is not in the past
    if (selectedDateObj.toDateString() === today.toDateString()) {
      const now = new Date();
      if (selectedDateObj.getTime() < now.getTime()) {
        setDisplayMessage({
          text: "Scheduled time cannot be in the past for today's date.",
          type: "error",
        });
        return;
      }
    }

    const updateData = {
      scheduledDate: selectedDateObj.toISOString(), // ISO string
      scheduledTime: scheduleTime, // "HH:MM"
    };

    dispatch(updateLead({ leadId, updateData }))
      .unwrap()
      .then(() => {
        setDisplayMessage({
          text: "Activity scheduled for lead.",
          type: "success",
        });
        setActiveScheduleDropdownId(null);
        resetScheduleForm();
        dispatch(fetchEmployeeLeads({ employeeId, status: filterStatus }));
      })
      .catch((err) => {
        setDisplayMessage({
          text: `Failed to schedule activity: ${err}`,
          type: "error",
        });
      });
  };

  if (error) {
    return <div className="error-screen">Error: {error}</div>;
  }

  return (
    <div className="leads-page-content">
      <div className="leads-controls">
        <input
          type="text"
          placeholder="Search leads..."
          value={localSearch}
          onChange={handleSearchChange}
          className="search-input"
        />
        <select
          value={filterStatus}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Message Display Area */}
      <div className="message-display-section">
        {displayMessage.text && (
          <div className={`lead-message ${displayMessage.type}`}>
            {displayMessage.text}
          </div>
        )}
      </div>

      <div className="leads-list">
        {leads.length > 0 ? (
          leads.map((lead) => (
            <div key={lead._id} className="lead-card">
              <div className="lead-info">
                <h4 className="lead-name">{lead.name}</h4>
                <p className="lead-detail">Email: {lead.email || "N/A"}</p>
                <p className="lead-detail">Phone: {lead.phone || "N/A"}</p>
                <p className="lead-detail">
                  Status: {lead.status === "Pending" ? "Ongoing" : "Closed"}
                </p>

                {/* Updated to use lead-type-badge */}
                <p className="lead-detail">
                  Type:{" "}
                  <span
                    className={`lead-type-badge type-${(
                      lead.leadType || ""
                    ).toLowerCase()}`}
                  >
                    {lead.leadType || "N/A"}
                  </span>
                </p>
              </div>
              <div className="lead-actions">
                <div
                  className="action-container"
                  ref={
                    activeUpdateDropdownId === lead._id
                      ? updateDropdownRef
                      : null
                  }
                >
                  <button
                    onClick={() => {
                      if (lead.status === "Closed") {
                        setDisplayMessage({
                          text: "Closed leads cannot be updated.",
                          type: "error",
                        });
                      } else {
                        toggleUpdateDropdown(lead);
                      }
                    }}
                    className="action-button update-button"
                  >
                    Update
                  </button>
                  {activeUpdateDropdownId === lead._id && (
                    <div className="action-dropdown update-dropdown">
                      <div className="form-group">
                        <label>Lead Type</label>
                        <select
                          value={currentLeadType}
                          onChange={(e) => setCurrentLeadType(e.target.value)}
                        >
                          <option value="Hot">Hot</option>
                          <option value="Warm">Warm</option>
                          <option value="Cold">Cold</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Lead Status</label>
                        <select
                          value={currentLeadStatus}
                          onChange={(e) => setCurrentLeadStatus(e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                      <div className="dropdown-buttons">
                        <button
                          onClick={() => handleUpdateSave(lead._id)}
                          className="save-button"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setActiveUpdateDropdownId(null)}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div
                  className="action-container"
                  ref={
                    activeScheduleDropdownId === lead._id
                      ? scheduleDropdownRef
                      : null
                  }
                >
                  <button
                    onClick={() => {
                      if (lead.status === "Closed") {
                        setDisplayMessage({
                          text: "Closed leads cannot be scheduled.",
                          type: "error",
                        });
                      } else {
                        toggleScheduleDropdown(lead);
                      }
                    }}
                    className="action-button schedule-button"
                  >
                    Schedule
                  </button>
                  {activeScheduleDropdownId === lead._id && (
                    <div className="action-dropdown schedule-dropdown">
                      <div className="form-group">
                        <label>Date</label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]} // Min date is today
                        />
                      </div>
                      <div className="form-group">
                        <label>Time</label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                        />
                      </div>

                      <div className="dropdown-buttons">
                        <button
                          onClick={() => handleScheduleSave(lead._id)}
                          className="save-button"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setActiveScheduleDropdownId(null);
                            resetScheduleForm();
                          }}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-leads-message">No leads found.</p>
        )}
      </div>
    </div>
  );
};

export default LeadsPage;
