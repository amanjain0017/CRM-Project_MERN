import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployees } from "../../../redux/slices/employeeSlice";
import "./EmployeesTableStyle.css";

// Helper function to get initials
const getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return "";
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
  return `${firstInitial}${lastInitial}`;
};

const EmployeesTable = () => {
  const dispatch = useDispatch();
  const {
    list: employees,
    isLoading,
    error,
  } = useSelector((state) => state.employees);

  useEffect(() => {
    dispatch(fetchEmployees({ page: 1, limit: 10000, search: "" }));
  }, [dispatch]); // re-fetch if dispatch changes

  return (
    <div className="dashboard-employees-table-section">
      {isLoading && <div className="loading-message">Loading employees...</div>}
      {error && (
        <div className="error-message">Error loading employees: {error}</div>
      )}
      {!isLoading && !error && employees.length === 0 ? (
        <div className="no-employees-message">No employees found.</div>
      ) : (
        <div className="dashboard-employees-table-container">
          <table className="dashboard-employees-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Employee ID</th>
                <th>Assigned Leads</th>
                <th>Closed Leads</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id}>
                  <td className="employee-name-cell">
                    <div className="employee-info">
                      <div className="initials-circle">
                        {getInitials(employee.firstName, employee.lastName)}
                      </div>
                      <div className="name-email">
                        <div className="employee-full-name">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="employee-email">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{employee.customEmployeeId}</td>
                  <td>{employee.assignedLeads}</td>
                  <td>{employee.convertedLeads}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        employee.isActive ? "status-active" : "status-inactive"
                      }`}
                    >
                      {employee.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeesTable;
