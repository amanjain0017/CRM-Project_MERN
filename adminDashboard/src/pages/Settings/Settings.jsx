import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAdminProfile } from "../../redux/slices/adminProfileSlice";
import axios from "axios";

import "./SettingsStyle.css";

const BACKEND_URL = "http://localhost:4000"; // for api calls

const Settings = () => {
  //redux state and dispatch hooks
  const dispatch = useDispatch();
  const { adminUser, isLoading, error } = useSelector(
    (state) => state.adminProfile
  );

  // Local component states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "••••••••",
    confirmPassword: "••••••••",
  });

  const [isSaving, setIsSaving] = useState(false); // shows save in progress and disables save button
  const [saveSuccess, setSaveSuccess] = useState(false); // shows if save successful
  const [saveError, setSaveError] = useState(null); //holds error mssg during save

  // useEffect hooks
  //to populate form fields with latest admin data (runs on mount and whenever adminUser changes)
  useEffect(() => {
    if (adminUser) {
      setFormData({
        firstName: adminUser.firstName || "",
        lastName: adminUser.lastName || "",
        email: adminUser.email || "",
        password: "••••••••",
        confirmPassword: "••••••••",
      });
    }
  }, [adminUser]);

  // to handle Redux fetch errors (e.g., initial fetch errors)
  useEffect(() => {
    if (error) {
      setSaveError(error);
    }
  }, [error, dispatch]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Clear success/error messages on input change
    setSaveSuccess(false);
    setSaveError(null);
  };

  // Handle form submission for updating admin profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      // Data to send to backend. Only sending editable fields.
      const updatePayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      };

      //  updating a user is /api/employees/:id (userRoutes.js)
      const response = await axios.patch(
        `${BACKEND_URL}/api/employees/${adminUser._id}`,
        updatePayload
      );

      if (response.status === 200) {
        setSaveSuccess(true);
        dispatch(fetchAdminProfile()); // update Redux state with latest data
      }
    } catch (err) {
      console.error("Error updating admin profile:", err);
      setSaveError(
        err.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="component-navigate">Home &gt; Settings</div>
      <div className="settings-page">
        <h2 className="settings-heading">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-groups">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                readOnly
                className="form-input read-only-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                readOnly
                className="form-input read-only-input"
              />
            </div>
          </div>

          {/* Save Status Messages */}
          <div className="save-group">
            {isSaving && (
              <p className="save-status-message saving">Saving changes...</p>
            )}
            {saveSuccess && (
              <p className="save-status-message success">
                Profile updated successfully!
              </p>
            )}
            {saveError && (
              <p className="save-status-message error">Error: {saveError}</p>
            )}

            <div className="form-actions">
              <button type="submit" className="save-button" disabled={isSaving}>
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default Settings;
