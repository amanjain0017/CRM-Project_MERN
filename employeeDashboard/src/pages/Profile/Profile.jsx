import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateEmployeeProfile,
  clearAuthError,
  logoutEmployee,
} from "../../redux/slices/authSlice";

import "./Profile.css";

const Profile = ({ employeeId, employeeProfile }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");

  // Populate form fields when employeeProfile changes
  useEffect(() => {
    if (employeeProfile) {
      setFirstName(employeeProfile.firstName || "");
      setEmail(employeeProfile.email || "");
    }
  }, [employeeProfile]);

  // Clear errors when inputs change
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch, firstName, email]);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    const profileData = { firstName, email };
    dispatch(updateEmployeeProfile({ employeeId: employeeId, profileData }));
  };

  if (isLoading && !employeeProfile) {
    return <div className="loading-screen">Loading profile...</div>;
  }

  if (error) {
    return <div className="error-screen">Error: {error}</div>;
  }

  return (
    <div className="profile-page-content">
      <div className="profile-section">
        <form onSubmit={handleProfileUpdate} className="profile-form">
          <div className="form-group">
            <label htmlFor="customEmployeeId">Employee ID</label>
            <input
              type="text"
              id="customEmployeeId"
              value={employeeProfile?.customEmployeeId || "N/A"}
              disabled
              className="form-input disabled"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              value={employeeProfile?.lastName || "N/A"}
              className="form-input disabled"
              disabled
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              value={employeeProfile?.location || "N/A"}
              disabled
              className="form-input disabled"
              required
            />
          </div>

          <button type="submit" className="profile-button">
            Update
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
