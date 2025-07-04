// src/pages/Auth/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginEmployee, clearAuthError } from "../../redux/slices/authSlice";
import "./Login.css"; // Styling for login page

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // Clear error message when component mounts or inputs change
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch, email, password]);

  // Handle redirection after successful login
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to dashboard or profile page after successful login
      console.log("Login successful, redirecting...");
      // For now, we'll let App.jsx handle the conditional rendering based on isAuthenticated
    }
  }, [isAuthenticated]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginEmployee({ email, password }));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Employee Login</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={isLoading} className="auth-button">
            {isLoading ? "Logging In..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
