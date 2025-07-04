// Routes for Admin Dashboard data
const express = require("express");
const router = express.Router();

// Import controllers
const {
  getOverallSummary,
  getEmployeePerformance,
  getDailyClosedLeads,
  getRecentActivities,
  getAdminProfile,
} = require("../controllers/adminDashboardController");

// Get overall CRM summary statistics (total leads, new leads, converted, etc.)
router.get("/summary", getOverallSummary);

// Get performance metrics for all employees
router.get("/employee-performance", getEmployeePerformance);

// Get a list of recent lead-related activities
router.get("/recent-activities", getRecentActivities);

// Get the number of leads closed per day for charting
router.get("/daily-closed-leads", getDailyClosedLeads);

// Get the profile of the single admin user
router.get("/profile", getAdminProfile);
module.exports = router;
