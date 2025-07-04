import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../../redux/slices/employeeSlice";

import "./EmployeesStyle.css";
import deleteIcon from "../../assets/delete.png";
import editIcon from "../../assets/edit.png";
import EmployeeFormModal from "../../components/Employee/EmployeeFormModal";
import ConfirmDeleteModal from "../../components/Employee/ConfirmDeleteModal";
import Header from "../../components/Layout/Header/Header";

// Helper function to get initials of employee name
const getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return "";
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
  return `${firstInitial}${lastInitial}`;
};

const Employees = () => {
  //redux hooks
  const dispatch = useDispatch();
  const {
    list: employees,
    isLoading,
    error,
    currentPage,
    totalPages,
  } = useSelector((state) => state.employees);

  // local state variables for search and pagination
  const [searchQuery, setSearchQuery] = useState(""); // search input
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6); //items per page

  // sorting state: { key: 'fieldName', direction: 'asc' | 'desc' | null }
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // states for modal visibility and data
  const [isFormModalOpen, setIsFormModalOpen] = useState(false); // for Add/Edit
  const [employeeToEdit, setEmployeeToEdit] = useState(null); // Null for Add, object for Edit
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); //for Delete
  const [employeeToDeleteId, setEmployeeToDeleteId] = useState(null); //id of to be deleted employee

  // Fetch employees if component mounts or search/pagination parameters change
  useEffect(() => {
    const params = {
      page,
      limit,
      search: searchQuery,
    };
    dispatch(fetchEmployees(params));
  }, [dispatch, page, limit, searchQuery]);

  // Handle errors from Redux store
  useEffect(() => {
    if (error) {
      console.error("Employees Fetch Error:", error);
    }
  }, [error, dispatch]);

  // Handlers for UI interactions
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setPage(1); // first page on new search
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Sorting logic using useMemo
  const sortedEmployees = useMemo(() => {
    let sortableItems = [...employees]; // Create a mutable copy
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Handle string comparison (case-insensitive for names/emails/IDs)
        if (typeof aValue === "string" && typeof bValue === "string") {
          if (aValue.toLowerCase() < bValue.toLowerCase()) {
            return sortConfig.direction === "asc" ? -1 : 1;
          }
          if (aValue.toLowerCase() > bValue.toLowerCase()) {
            return sortConfig.direction === "asc" ? 1 : -1;
          }
        } else {
          // Handle numeric or boolean comparison
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
  }, [employees, sortConfig]);

  // Handle sort click on table headers
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null; // Reset to no sort
      } else {
        direction = "asc"; // Start with ascending
      }
    }
    setSortConfig({ key, direction });
  };

  // Helper for applying sort indicator class names
  const getClassNamesFor = (name) => {
    if (!sortConfig.key) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };

  // Modal Handlers
  // Open Add Employee Modal
  const openAddEmployeeModal = () => {
    setEmployeeToEdit(null); // no employee for editing
    setIsFormModalOpen(true);
  };

  // Open Edit Employee Modal
  const openEditEmployeeModal = (employee) => {
    setEmployeeToEdit(employee); // employee to be edited
    setIsFormModalOpen(true);
  };

  // Close Form Modal (Add/Edit)
  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEmployeeToEdit(null);
  };

  // Handle Save (Add/Edit) from EmployeeFormModal
  const handleSaveEmployee = async (employeeData) => {
    if (employeeToEdit) {
      // edit

      const updatesToSend = { ...employeeData };
      delete updatesToSend.lastName;
      delete updatesToSend.language;
      delete updatesToSend.location;

      await dispatch(
        updateEmployee({ id: employeeToEdit._id, employeeData: updatesToSend })
      );
    } else {
      // add
      await dispatch(createEmployee(employeeData));
    }
    closeFormModal();
    dispatch(fetchEmployees({ page, limit, search: searchQuery })); // Re-fetch to update list
  };

  // Open Delete Confirmation Modal
  const openDeleteConfirmationModal = (employeeId) => {
    setEmployeeToDeleteId(employeeId);
    setIsDeleteModalOpen(true);
  };

  // Close Delete Confirmation Modal
  const closeDeleteConfirmationModal = () => {
    setIsDeleteModalOpen(false);
    setEmployeeToDeleteId(null);
  };

  // Handle Delete from ConfirmDeleteModal
  const handleDeleteEmployee = async () => {
    if (employeeToDeleteId) {
      await dispatch(deleteEmployee(employeeToDeleteId));
      closeDeleteConfirmationModal();
      dispatch(fetchEmployees({ page, limit, search: searchQuery })); // Re-fetch to update list
    }
  };

  return (
    <>
      <Header
        activePage="Employees"
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <div className="component-navigate">Home &gt; Employees</div>

      <div className="employee-page">
        <div className="employees-actions">
          <button
            onClick={openAddEmployeeModal}
            className="add-employee-button"
          >
            Add Employee
          </button>
        </div>

        <div className="employees-list">
          {/* Loading and Error States (received from redux state*/}
          {isLoading && (
            <div className="loading-message">
              <p>Loading employees...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
            </div>
          )}

          <div className="list-pagination-flex">
            {/* Employee List Table */}
            {!isLoading && !error && sortedEmployees.length > 0 && (
              <div className="employees-table-container">
                <table className="employees-table">
                  <thead>
                    <tr>
                      {/* Name Column */}
                      <th
                        onClick={() => handleSort("firstName")}
                        className={`sortable-header ${getClassNamesFor(
                          "firstName"
                        )}`}
                      >
                        Name
                        {sortConfig.key === "firstName" && (
                          <span className="sort-indicator">
                            {sortConfig.direction === "asc"
                              ? " ▲"
                              : sortConfig.direction === "desc"
                              ? " ▼"
                              : ""}
                          </span>
                        )}
                      </th>
                      {/* Employee ID Column */}
                      <th
                        onClick={() => handleSort("customEmployeeId")}
                        className={`sortable-header ${getClassNamesFor(
                          "customEmployeeId"
                        )}`}
                      >
                        Employee ID
                        {sortConfig.key === "customEmployeeId" && (
                          <span className="sort-indicator">
                            {sortConfig.direction === "asc"
                              ? " ▲"
                              : sortConfig.direction === "desc"
                              ? " ▼"
                              : ""}
                          </span>
                        )}
                      </th>
                      {/* Assigned Leads Column */}
                      <th
                        onClick={() => handleSort("assignedLeads")}
                        className={`sortable-header ${getClassNamesFor(
                          "assignedLeads"
                        )}`}
                      >
                        Assigned Leads
                        {sortConfig.key === "assignedLeads" && (
                          <span className="sort-indicator">
                            {sortConfig.direction === "asc"
                              ? " ▲"
                              : sortConfig.direction === "desc"
                              ? " ▼"
                              : ""}
                          </span>
                        )}
                      </th>
                      {/* Closed Leads Column */}
                      <th
                        onClick={() => handleSort("convertedLeads")}
                        className={`sortable-header ${getClassNamesFor(
                          "convertedLeads"
                        )}`}
                      >
                        Closed Leads
                        {sortConfig.key === "convertedLeads" && (
                          <span className="sort-indicator">
                            {sortConfig.direction === "asc"
                              ? " ▲"
                              : sortConfig.direction === "desc"
                              ? " ▼"
                              : ""}
                          </span>
                        )}
                      </th>
                      {/* Status Column */}
                      <th
                        onClick={() => handleSort("isActive")}
                        className={`sortable-header ${getClassNamesFor(
                          "isActive"
                        )}`}
                      >
                        Status
                        {sortConfig.key === "isActive" && (
                          <span className="sort-indicator">
                            {sortConfig.direction === "asc"
                              ? " ▲"
                              : sortConfig.direction === "desc"
                              ? " ▼"
                              : ""}
                          </span>
                        )}
                      </th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* sortedEmployees for rendering */}
                    {sortedEmployees.map((employee) => (
                      <tr key={employee._id}>
                        <td className="employee-name-cell">
                          <div className="employee-info">
                            <div className="initials-circle">
                              {getInitials(
                                employee.firstName,
                                employee.lastName
                              )}
                            </div>
                            <div className="name-email">
                              <div className="employee-full-name">
                                {employee.firstName} {employee.lastName}
                              </div>
                              <div className="employee-email">
                                {employee.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="customEmployeeId">
                          {employee.customEmployeeId}
                        </td>
                        {/* Display actual assignedLeads and convertedLeads from backend */}
                        <td>{employee.assignedLeads}</td>
                        <td>{employee.convertedLeads}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              employee.isActive
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {employee.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <div className="actions-buttons">
                            <button
                              onClick={() => openEditEmployeeModal(employee)} // Use the new handler
                              className="edit-button"
                            >
                              <img src={editIcon} alt="edit-icon" width={22} />
                            </button>
                            <button
                              onClick={() =>
                                openDeleteConfirmationModal(employee._id)
                              } // Use the new handler
                              className="delete-button"
                            >
                              <img
                                src={deleteIcon}
                                alt="delete-icon"
                                width={20}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoading && !error && totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="pagination-button"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Employee Form Modal (for Add and Edit) */}
          {isFormModalOpen && (
            <EmployeeFormModal
              employee={employeeToEdit} // Pass null for Add, employee object for Edit
              onClose={closeFormModal}
              onSave={handleSaveEmployee}
            />
          )}

          {/* Confirm Delete Modal */}
          {isDeleteModalOpen && (
            <ConfirmDeleteModal
              employeeId={employeeToDeleteId}
              onClose={closeDeleteConfirmationModal}
              onDelete={handleDeleteEmployee}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Employees;
