import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeads, clearUploadStatus } from "../../redux/slices/leadSlice";

import "./LeadsStyle.css";
import Header from "../../components/Layout/Header/Header";
import UploadCSVModal from "../../components/Leads/UploadCSVModal";

const Leads = () => {
  ////redux hooks
  const dispatch = useDispatch();
  const {
    list: leads,
    isLoading,
    error,
    uploadStatus,
    uploadMessage,
    uploadErrors,
  } = useSelector((state) => state.leads);

  // search state
  const [searchQuery, setSearchQuery] = useState("");

  // sorting state: { key: 'fieldName', direction: 'asc' | 'desc' | null }
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // State for CSV Upload Modal visibility
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Fetch employees if component mounts or search parameters change
  useEffect(() => {
    dispatch(fetchLeads({ page: 1, limit: 10000, search: searchQuery }));
  }, [dispatch, searchQuery]);

  // Error Handling
  useEffect(() => {
    if (error) {
      console.error("Leads Fetch Error:", error);
    }

    // upload specific messages/errors
    if (uploadStatus === "success" && uploadMessage) {
      console.log(uploadMessage); // success upload logged
    } else if (uploadStatus === "failed" && uploadMessage) {
      console.log(
        `Upload Failed: ${uploadMessage}\n${uploadErrors
          .map((err) => err.message || err)
          .join("\n")}`
      );
      dispatch(clearUploadStatus()); //clear status
    }
  }, [error, uploadStatus, uploadMessage, uploadErrors, dispatch]);

  // // Handlers for UI interactions
  const handleSearchChange = (value) => {
    setSearchQuery(value);
  };

  // Sorting logic using useMemo
  const sortedLeads = useMemo(() => {
    let sortableItems = [...leads]; // Create a mutable copy
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Handle string comparison (case-insensitive for names/emails/etc.)
        if (typeof aValue === "string" && typeof bValue === "string") {
          if (aValue.toLowerCase() < bValue.toLowerCase()) {
            return sortConfig.direction === "asc" ? -1 : 1;
          }
          if (aValue.toLowerCase() > bValue.toLowerCase()) {
            return sortConfig.direction === "asc" ? 1 : -1;
          }
        } else {
          // Handle other types (e.g., numbers, booleans - though not expected for these columns)
          if (aValue < bValue) {
            return sortConfig.direction === "asc" ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === "asc" ? 1 : -1;
          }
        }
        return 0;
      });
    }
    return sortableItems;
  }, [leads, sortConfig]); // Re-sort when leads data or sort config changes

  // Handle sort click on table headers
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      } else {
        direction = "asc";
      }
    }
    setSortConfig({ key, direction });
  };

  // Helper for applying sort indicator class names
  const getClassNamesFor = (name) => {
    if (!sortConfig.key) {
      return ""; // No class if no sort
    }
    return sortConfig.key === name ? sortConfig.direction : "";
  };

  // --- CSV Upload Modal Handlers ---
  const openUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    dispatch(clearUploadStatus());
    dispatch(fetchLeads({ page: 1, limit: 10000, search: searchQuery })); // Re-fetch leads after potential upload
  };

  return (
    <>
      {/* Header component for search */}
      <Header
        activePage="Leads"
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <div className="component-navigate">Home &gt; Leads</div>

      <div className="leads-page">
        <div className="leads-actions">
          <button onClick={openUploadModal} className="upload-csv-button">
            Upload Leads CSV
          </button>
        </div>

        {/* error state */}
        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
          </div>
        )}

        {/* Leads List Table */}
        {!isLoading && !error && leads.length === 0 ? (
          <div className="no-leads-message">No leads found.</div>
        ) : (
          <div className="leads-table-container">
            <table className="leads-table">
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    className={`sortable-header ${getClassNamesFor("name")}`}
                  >
                    Name
                    {sortConfig.key === "name" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("email")}
                    className={`sortable-header ${getClassNamesFor("email")}`}
                  >
                    Email
                    {sortConfig.key === "email" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("phone")}
                    className={`sortable-header ${getClassNamesFor("phone")}`}
                  >
                    Phone
                    {sortConfig.key === "phone" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("language")}
                    className={`sortable-header ${getClassNamesFor(
                      "language"
                    )}`}
                  >
                    Language
                    {sortConfig.key === "language" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("location")}
                    className={`sortable-header ${getClassNamesFor(
                      "location"
                    )}`}
                  >
                    Location
                    {sortConfig.key === "location" && (
                      <span className="sort-indicator">
                        {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                      </span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map((lead) => (
                  <tr key={lead._id}>
                    <td>{lead.name}</td>
                    <td>{lead.email || "N/A"}</td>
                    {/* Display N/A if email is null */}
                    <td>{lead.phone || "N/A"}</td>
                    {/* Display N/A if phone is null */}
                    <td>{lead.language}</td>
                    <td>{lead.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CSV Upload Modal */}
        {isUploadModalOpen && (
          <UploadCSVModal
            isOpen={isUploadModalOpen}
            onClose={closeUploadModal}
            uploadStatus={uploadStatus}
            uploadMessage={uploadMessage}
            uploadErrors={uploadErrors}
            setIsUploadModalOpen={setIsUploadModalOpen}
          />
        )}
      </div>
    </>
  );
};

export default Leads;
