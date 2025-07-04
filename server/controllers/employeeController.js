const User = require("../models/userModel");
const Attendance = require("../models/attendanceModel");
const Lead = require("../models/leadModel");
const bcrypt = require("bcryptjs");
const { getTodayUtcMidnight } = require("../utils/helpers");

// --- Employee Profile Management (Existing) ---
const updateEmployeePassword = async (req, res) => {
  const { employeeId } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current password and new password are required." });
  }
  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "New password must be at least 6 characters long." });
  }

  try {
    const employee = await User.findById(employeeId).select("+password");

    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found." });
    }

    const isMatch = await employee.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password." });
    }

    employee.password = newPassword;
    await employee.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating employee password:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res
      .status(500)
      .json({ message: "Server error: Could not update password." });
  }
};

const updateEmployeeProfileById = async (req, res) => {
  const { employeeId } = req.params;
  const { firstName, lastName, email } = req.body;

  try {
    const employee = await User.findById(employeeId);

    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found." });
    }

    if (firstName !== undefined) employee.firstName = firstName;
    if (lastName !== undefined) employee.lastName = lastName;
    if (email !== undefined) {
      if (email !== employee.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== employeeId) {
          return res
            .status(400)
            .json({ message: "This email is already in use by another user." });
        }
      }
      employee.email = email;
    }

    const updatedEmployee = await employee.save();

    res.status(200).json({
      id: updatedEmployee._id,
      firstName: updatedEmployee.firstName,
      lastName: updatedEmployee.lastName,
      email: updatedEmployee.email,
      role: updatedEmployee.role,
      customEmployeeId: updatedEmployee.customEmployeeId,
      language: updatedEmployee.language,
      location: updatedEmployee.location,
      isActive: updatedEmployee.isActive,
    });
  } catch (error) {
    console.error("Error updating employee profile by ID:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "A user with this email already exists." });
    }
    res
      .status(500)
      .json({ message: "Server error: Could not update employee profile." });
  }
};

// --- Employee Timings/Attendance Management ---

// GET /api/employee/:employeeId/attendance
const getEmployeeAttendance = async (req, res) => {
  const { employeeId } = req.params;
  const { date } = req.query;

  let queryDate = getTodayUtcMidnight();
  if (date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }
    parsedDate.setUTCHours(0, 0, 0, 0);
    queryDate = parsedDate;
  }

  try {
    const employee = await User.findById(employeeId).select(
      "_id role isActive"
    );
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found." });
    }

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: queryDate,
    });

    let onBreakStatus = false;
    let currentBreakStartTime = null;
    if (attendance && attendance.breaks && attendance.breaks.length > 0) {
      const lastBreak = attendance.breaks[attendance.breaks.length - 1];
      if (lastBreak && lastBreak.breakEnd === null) {
        onBreakStatus = true;
        currentBreakStartTime = lastBreak.breakStart;
      }
    }

    if (!attendance) {
      // Return a default empty attendance record for the day
      return res.status(200).json({
        employee: employeeId,
        date: queryDate.toISOString().split("T")[0],
        firstCheckIn: null,
        finalCheckOut: null,
        workPeriods: [],
        breaks: [],
        onBreak: false,
        breakStartTime: null,
        isActive: employee.isActive, // Use isActive from User model
        message: "No attendance record found for this date.",
      });
    }

    res.status(200).json({
      ...attendance.toObject(),
      onBreak: onBreakStatus,
      breakStartTime: currentBreakStartTime,
      isActive: employee.isActive, // Use isActive from User model
    });
  } catch (error) {
    console.error("Error fetching employee attendance:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid employee ID format." });
    }
    res
      .status(500)
      .json({ message: "Server error: Could not retrieve attendance." });
  }
};

// GET /api/employee/:employeeId/breaks/history
const getEmployeeBreaksHistory = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const employee = await User.findById(employeeId).select("_id role");
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found." });
    }

    const allAttendanceRecords = await Attendance.find({
      employee: employeeId,
    }).sort({ date: -1 });

    let allCompletedBreaks = [];
    allAttendanceRecords.forEach((record) => {
      const completedBreaks = record.breaks.filter((b) => b.breakEnd !== null);
      allCompletedBreaks = allCompletedBreaks.concat(
        completedBreaks.map((b) => ({
          ...b.toObject(),
          date: record.date.toISOString().split("T")[0],
        }))
      );
    });

    allCompletedBreaks.sort(
      (a, b) => b.breakStart.getTime() - a.breakStart.getTime()
    );

    res.status(200).json(allCompletedBreaks);
  } catch (error) {
    console.error("Error fetching employee breaks history:", error);
    res
      .status(500)
      .json({ message: "Server error: Could not retrieve breaks history." });
  }
};

// POST /api/employee/:employeeId/check-in
const employeeCheckIn = async (req, res) => {
  const { employeeId } = req.params;
  const today = getTodayUtcMidnight();
  const currentTime = new Date();

  try {
    const employee = await User.findById(employeeId).select(
      "_id role isActive"
    );
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found." });
    }

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: today,
    });

    // Case 1: First check-in of the day
    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date: today,
        firstCheckIn: currentTime,
        workPeriods: [{ start: currentTime, end: null }],
      });
      employee.isActive = true; // Set active
      await employee.save();
      await attendance.save();
      return res
        .status(200)
        .json({ message: "First check-in successful!", attendance });
    }

    // If attendance record exists for today, check current state
    const lastWorkPeriod =
      attendance.workPeriods[attendance.workPeriods.length - 1];
    const lastBreak = attendance.breaks[attendance.breaks.length - 1];

    if (attendance.finalCheckOut !== null) {
      return res.status(400).json({
        message:
          "Cannot check in: Employee has already checked out for the day.",
      });
    }

    if (lastWorkPeriod && lastWorkPeriod.end === null) {
      return res.status(400).json({
        message:
          "Cannot check in: Employee is already checked in (ongoing work period).",
      });
    }

    if (lastBreak && lastBreak.breakEnd === null) {
      // Case 2: Resuming work after an active break
      lastBreak.breakEnd = currentTime; // End the active break
      attendance.workPeriods.push({ start: currentTime, end: null }); // Start new work period
      employee.isActive = true; // Set active
      await employee.save();
      await attendance.save();
      return res
        .status(200)
        .json({ message: "Break ended, resumed work!", attendance });
    }

    // Case 3: Re-entering after a temporary checkout (e.g., if they checked out for a quick errand and want to re-check-in without a formal break)
    // This is less common, but handles cases where lastWorkPeriod.end is NOT null, and there's no active break.
    // It essentially starts a new work period.
    if (
      lastWorkPeriod &&
      lastWorkPeriod.end !== null &&
      (!lastBreak || lastBreak.breakEnd !== null)
    ) {
      attendance.workPeriods.push({ start: currentTime, end: null });
      employee.isActive = true; // Set active
      await employee.save();
      await attendance.save();
      return res
        .status(200)
        .json({ message: "Re-entry successful!", attendance });
    }

    return res.status(400).json({ message: "Cannot check in: Invalid state." });
  } catch (error) {
    console.error("Error during employee check-in:", error);
    res
      .status(500)
      .json({ message: "Server error: Could not process check-in." });
  }
};

// POST /api/employee/:employeeId/start-break
const employeeStartBreak = async (req, res) => {
  const { employeeId } = req.params;
  const today = getTodayUtcMidnight();
  const currentTime = new Date();

  try {
    const employee = await User.findById(employeeId).select(
      "_id role isActive"
    );
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found." });
    }

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today,
    });

    if (
      !attendance ||
      !attendance.firstCheckIn ||
      attendance.finalCheckOut !== null
    ) {
      return res.status(400).json({
        message:
          "Cannot start break: Employee is not checked in or already checked out.",
      });
    }

    const lastWorkPeriod =
      attendance.workPeriods[attendance.workPeriods.length - 1];
    if (!lastWorkPeriod || lastWorkPeriod.end !== null) {
      return res.status(400).json({
        message: "Cannot start break: No active work session to pause.",
      });
    }

    const lastBreak = attendance.breaks[attendance.breaks.length - 1];
    if (lastBreak && lastBreak.breakEnd === null) {
      return res.status(400).json({
        message: "Cannot start break: Employee is already on an active break.",
      });
    }

    // End the current work period to start a break
    lastWorkPeriod.end = currentTime;
    attendance.breaks.push({ breakStart: currentTime, breakEnd: null }); // Start a new break period

    employee.isActive = false; // Employee is NOT active/online during break
    await employee.save();
    await attendance.save();

    res.status(200).json({ message: "Break started!", attendance });
  } catch (error) {
    console.error("Error during employee start break:", error);
    res.status(500).json({ message: "Server error: Could not start break." });
  }
};

// POST /api/employee/:employeeId/end-break
const employeeEndBreak = async (req, res) => {
  const { employeeId } = req.params;
  const today = getTodayUtcMidnight();
  const currentTime = new Date();

  try {
    const employee = await User.findById(employeeId).select(
      "_id role isActive"
    );
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found." });
    }

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today,
    });

    if (
      !attendance ||
      !attendance.firstCheckIn ||
      attendance.finalCheckOut !== null
    ) {
      return res.status(400).json({
        message:
          "Cannot end break: Employee is not checked in or already checked out.",
      });
    }

    const lastBreak = attendance.breaks[attendance.breaks.length - 1];
    if (!lastBreak || lastBreak.breakEnd !== null) {
      return res
        .status(400)
        .json({ message: "Cannot end break: No active break to end." });
    }

    // End the current break
    lastBreak.breakEnd = currentTime;
    attendance.workPeriods.push({ start: currentTime, end: null }); // Resume work by starting new work period

    employee.isActive = true; // Employee is active/online after ending break
    await employee.save();
    await attendance.save();

    res.status(200).json({ message: "Break ended, resumed work!", attendance });
  } catch (error) {
    console.error("Error during employee end break:", error);
    res.status(500).json({ message: "Server error: Could not end break." });
  }
};

// POST /api/employee/:employeeId/final-check-out
const employeeFinalCheckOut = async (req, res) => {
  const { employeeId } = req.params;
  const today = getTodayUtcMidnight();
  const currentTime = new Date();

  try {
    const employee = await User.findById(employeeId).select(
      "_id role isActive"
    );
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found." });
    }

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today,
    });

    if (!attendance || !attendance.firstCheckIn) {
      return res.status(400).json({
        message: "Cannot check out: Employee has not checked in today.",
      });
    }

    const lastWorkPeriod =
      attendance.workPeriods[attendance.workPeriods.length - 1];
    if (!lastWorkPeriod || lastWorkPeriod.end !== null) {
      return res
        .status(400)
        .json({ message: "Cannot check out: No active work session to end." });
    }

    const lastBreak = attendance.breaks[attendance.breaks.length - 1];
    if (lastBreak && lastBreak.breakEnd === null) {
      return res.status(400).json({
        message:
          "Cannot check out: Employee is currently on an active break. Please end break first.",
      });
    }

    // End the current work period
    lastWorkPeriod.end = currentTime;
    attendance.finalCheckOut = currentTime; // Set final checkout time
    employee.isActive = false; // Set employee to inactive/offline
    await employee.save();
    await attendance.save();

    res
      .status(200)
      .json({ message: "Final check-out successful!", attendance });
  } catch (error) {
    console.error("Error during employee final check-out:", error);
    res
      .status(500)
      .json({ message: "Server error: Could not process final check-out." });
  }
};

// Get recent activities specifically for an employee (employee-centric)
const getEmployeeRecentActivities = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const employee = await User.findById(employeeId).select("_id role");
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found." });
    }

    const recentLeads = await Lead.find({ assignedTo: employeeId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select("name status assignedTo createdAt updatedAt");

    const activities = [];

    for (const lead of recentLeads) {
      let description = "";
      let relevantTimestamp = lead.updatedAt;

      const isCreationAndAssignment =
        Math.abs(lead.createdAt.getTime() - lead.updatedAt.getTime()) < 1000;

      if (isCreationAndAssignment) {
        description = `You were assigned a new lead: '${lead.name}'.`;
        relevantTimestamp = lead.createdAt;
      } else if (lead.status === "Closed") {
        description = `You closed lead: '${lead.name}'.`;
        relevantTimestamp = lead.updatedAt;
      }

      if (description) {
        activities.push({
          leadId: lead._id,
          leadName: lead.name,
          activity: description,
          timestamp: relevantTimestamp.toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        });
      }
    }

    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    res.json(activities);
  } catch (error) {
    console.error("Error fetching employee recent activities:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid employee ID format." });
    }
    res.status(500).json({
      message: "Server error: Could not retrieve employee activities.",
    });
  }
};

module.exports = {
  updateEmployeePassword,
  updateEmployeeProfileById,
  getEmployeeAttendance,
  getEmployeeBreaksHistory,
  employeeCheckIn,
  employeeStartBreak,
  employeeEndBreak,
  employeeFinalCheckOut,
  getEmployeeRecentActivities,
};
