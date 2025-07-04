// routes for Employee Authentication
const express = require("express");
const router = express.Router();

const { employeeLogin } = require("../controllers/employeeAuthController");

// Authenticate employee (basic login)
router.post("/login", employeeLogin);

module.exports = router;
