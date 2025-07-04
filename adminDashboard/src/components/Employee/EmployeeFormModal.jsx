import { useState } from "react";
import "./Modal.css";

// language and location
const LANGUAGES = ["English", "Hindi", "Bengali", "Tamil"];
const LOCATIONS = ["Delhi", "Pune", "Hyderabad"];

const EmployeeFormModal = ({ employee, onClose, onSave }) => {
  // form data based on edit or create mode
  const [formData, setFormData] = useState({
    firstName: employee ? employee.firstName : "",
    lastName: employee ? employee.lastName : "",
    email: employee ? employee.email : "",
    language: employee ? employee.language : LANGUAGES[0], // default
    location: employee ? employee.location : LOCATIONS[0], // default
  });
  const [errors, setErrors] = useState({});

  // Determine if edit
  const isEditMode = !!employee;

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear error for the field being changed
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: null,
    }));
  };

  // form validation
  const validateForm = () => {
    let newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required.";
    if (!formData.lastName.trim())
      newErrors.lastName = "Last name is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid.";
    }
    if (!formData.language) newErrors.language = "Language is required.";
    if (!formData.location) newErrors.location = "Location is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  // form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">
          {isEditMode ? "Edit Employee" : "Add New Employee"}
        </h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`form-input ${errors.firstName ? "input-error" : ""}`}
            />
            {errors.firstName && (
              <p className="error-message">{errors.firstName}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`form-input ${errors.lastName ? "input-error" : ""}`}
              readOnly={isEditMode}
              disabled={isEditMode} // Disable to visually indicate it's not editable
            />
            {errors.lastName && (
              <p className="error-message">{errors.lastName}</p>
            )}
            {isEditMode && (
              <p className="info-message">Last name cannot be changed.</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? "input-error" : ""}`}
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              className={`form-input ${errors.language ? "input-error" : ""}`}
              readOnly={isEditMode}
              disabled={isEditMode} // Disable to visually indicate it's not editable
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            {errors.language && (
              <p className="error-message">{errors.language}</p>
            )}

            {isEditMode && (
              <p className="info-message">Language cannot be changed.</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`form-input ${errors.location ? "input-error" : ""}`}
              readOnly={isEditMode}
              disabled={isEditMode} // Disable to visually indicate it's not editable
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            {errors.location && (
              <p className="error-message">{errors.location}</p>
            )}

            {isEditMode && (
              <p className="info-message">Location cannot be changed.</p>
            )}
          </div>

          <div className="modal-actions">
            <button type="submit" className="save-button">
              {isEditMode ? "Update" : "Add"}
            </button>
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeFormModal;
