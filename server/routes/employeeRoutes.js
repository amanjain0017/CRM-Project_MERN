const express = require("express");
const router = express.Router();

// Import controller functions
const {
  updateEmployeePassword,
  getEmployeeAttendance,
  getEmployeeBreaksHistory,
  employeeCheckIn,
  employeeStartBreak,
  employeeEndBreak,
  employeeFinalCheckOut,
  getEmployeeRecentActivities,
} = require("../controllers/employeeController");

// --- Employee Profile Management ---

// PATCH /api/employee/:employeeId/password
// Allow an employee to update their own password
router.patch("/:employeeId/password", updateEmployeePassword);

// --- Employee Timings/Attendance Management ---

// GET /api/employee/:employeeId/attendance
// Get an employee's attendance record for a specific day (or today if no date provided)
router.get("/:employeeId/attendance", getEmployeeAttendance);

// GET /api/employee/:employeeId/breaks/history
// Get an employee's complete history of breaks, sorted by latest first.
router.get("/:employeeId/breaks/history", getEmployeeBreaksHistory);

// POST /api/employee/:employeeId/check-in - For initial check-in or resuming work
router.post("/:employeeId/check-in", employeeCheckIn);

// POST /api/employee/:employeeId/start-break -
router.post("/:employeeId/start-break", employeeStartBreak);

// POST /api/employee/:employeeId/end-break -
router.post("/:employeeId/end-break", employeeEndBreak);

// POST /api/employee/:employeeId/final-check-out - For final check-out of the day
router.post("/:employeeId/final-check-out", employeeFinalCheckOut);

// GET /api/employee/:employeeId/recent-activities
// Get recent activities for an employee
router.get("/:employeeId/recent-activities", getEmployeeRecentActivities);

module.exports = router;
