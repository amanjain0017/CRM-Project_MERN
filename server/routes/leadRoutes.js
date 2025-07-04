// routes to manage Leads
const express = require("express");
const router = express.Router();

//import controller functions
const {
  createLeadManual,
  uploadLeadsCSV,
  getAllLeads,
  getLeadById,
  updateLead,
} = require("../controllers/leadController");

// Add a single lead manually
router.post("/manual", createLeadManual);

// Upload leads via CSV file
router.post("/upload", uploadLeadsCSV);

// Get all leads (with filters, search, and pagination)
router.get("/", getAllLeads);

// Get a single lead by ID
router.get("/:id", getLeadById);

// Update lead details (status, assignedTo, leadType, receivedDate, name, email, phone, scheduledDate, scheduledTime)
router.patch("/:id", updateLead);

module.exports = router;
