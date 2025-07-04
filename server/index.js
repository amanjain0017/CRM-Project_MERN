// loading the environment variables
require("dotenv").config();

// express and cors instances
const express = require("express");
const app = express();
const cors = require("cors");

//mongoDB Connection
require("./db/connection");

// server port
const port = process.env.PORT || 4000;

// importing the routes
const userRoutes = require("./routes/userRoutes"); // employee management
const leadRoutes = require("./routes/leadRoutes"); // lead management
const adminDashboardRoutes = require("./routes/adminDashboardRoutes"); // dashboard data routes
const employeeAuthRoutes = require("./routes/employeeAuthRoutes"); //employee authentication routes
const employeeRoutes = require("./routes/employeeRoutes"); //employee specific routes

//Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Root route
app.get("/", (req, res) => {
  res.send("CRM Backend API is running...");
});

//application routes
app.use("/api/employees", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/employee/auth", employeeAuthRoutes);
app.use("/api/employee", employeeRoutes);

//starting the sever
app.listen(port, () => {
  console.log(`Server is running at port : ${port}`);
});
