const User = require("../models/userModel");
const Lead = require("../models/leadModel");
const bcrypt = require("bcryptjs");

const { redistributeLeads, generateEmployeeId } = require("../utils/helpers");

// get all data with employee role
// GET /api/employees
const getUsers = async (req, res) => {
  const {
    search,
    isActive,
    language,
    location,
    page = 1,
    limit = 6,
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  //  Aggregation Pipeline
  const pipeline = [];

  // Stage 1: $match - Apply initial filters based on query parameters
  const matchStage = { role: "employee" }; // filter by role 'employee'

  if (isActive !== undefined) {
    matchStage.isActive = isActive === "true";
  }
  if (language) {
    matchStage.language = language;
  }
  if (location) {
    matchStage.location = location;
  }

  // Add search conditions if a search query is provided
  if (search) {
    const searchRegex = { $regex: search, $options: "i" }; // Case-insensitive search
    const searchConditions = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { customEmployeeId: searchRegex },
    ];

    // Combine existing filters with search conditions using $and or $or
    const hasOtherFilters = Object.keys(matchStage).some(
      (key) => key !== "role"
    );

    if (hasOtherFilters) {
      // If other filters exist, combine them with search using $and
      pipeline.push({
        $match: {
          $and: [{ ...matchStage }, { $or: searchConditions }],
        },
      });
    } else {
      // If only 'role' filter, apply search conditions directly
      pipeline.push({
        $match: {
          $and: [
            // Use $and with role and search conditions
            { role: "employee" },
            { $or: searchConditions },
          ],
        },
      });
    }
  } else {
    // If no search query, apply the initial match stage
    pipeline.push({ $match: matchStage });
  }

  // Stage 2: $lookup - Join with the 'leads' collection
  pipeline.push({
    $lookup: {
      from: "leads",
      localField: "_id",
      foreignField: "assignedTo",
      as: "assignedLeadsData",
    },
  });

  // Stage 3: $project - Reshape documents and calculate lead counts
  pipeline.push({
    $project: {
      _id: 1, // Include the employee's ID
      firstName: 1,
      lastName: 1,
      email: 1,
      customEmployeeId: 1,
      language: 1,
      location: 1,
      isActive: 1,
      createdAt: 1,
      updatedAt: 1,
      // Calculate total assigned leads using the size of the 'assignedLeadsData' array
      assignedLeads: { $size: "$assignedLeadsData" },
      // Calculate converted leads by filtering 'assignedLeadsData'
      convertedLeads: {
        $size: {
          $filter: {
            input: "$assignedLeadsData",
            as: "lead",
            cond: { $eq: ["$$lead.status", "Closed"] }, // Condition: lead status = "Closed"
          },
        },
      },
      // Calculate pending leads by filtering 'assignedLeadsData'
      pendingLeads: {
        $size: {
          $filter: {
            input: "$assignedLeadsData",
            as: "lead",
            cond: { $eq: ["$$lead.status", "Pending"] }, // Condition: lead status = "Pending"
          },
        },
      },
    },
  });

  // Stage 4: $sort - Default sort by creation date desc
  pipeline.push({ $sort: { createdAt: -1 } });

  // Stage 5: $facet - Create two parallel pipelines for paginated results and total count
  // gets both the subset of data for the current page AND the total count

  pipeline.push({
    $facet: {
      // Pipeline for the actual paginated employee data
      paginatedResults: [
        { $skip: skip }, // Skip documents for pagination
        { $limit: limitNum }, // Limit documents for pagination
      ],
      // Pipeline for the total count of matching documents
      totalCount: [
        { $count: "total" }, // Count the documents that passed previous stages
      ],
    },
  });

  try {
    // Execute aggregation pipeline
    const result = await User.aggregate(pipeline);

    // Extract employees data and total count from the $facet output
    const employees = result[0].paginatedResults;
    const totalEmployees =
      result[0].totalCount.length > 0 ? result[0].totalCount[0].total : 0;

    // Send the response with paginated employees and total info
    res.status(200).json({
      employees,
      currentPage: pageNum,
      totalPages: Math.ceil(totalEmployees / limitNum),
      totalResults: totalEmployees,
    });
  } catch (err) {
    console.error(
      "Error fetching employees data with performance metrics:",
      err
    );
    res
      .status(500)
      .json({ error: "Server Error: Could not retrieve employee data." });
  }
};

//get a single user
// GET /api/employees/:id
const getUser = async (req, res) => {
  try {
    const id = req.params.id;
    const employee = await User.findById(id).select("-password -__v");

    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ error: "Employee not found." });
    }
    res.status(200).json(employee);
  } catch (err) {
    console.error("Error fetching employee data:", err);
    res.status(500).json({ error: "Server Error: Could not retrieve data" });
  }
};

//create a user
//POST /api/employees
const createUser = async (req, res) => {
  const { firstName, lastName, email, language, location } = req.body;
  const defaultPassword = lastName;

  //input validation
  if (!firstName || !lastName || !email || !language || !location) {
    return res.status(400).json({
      message:
        "First name, last name, email, language, and location are required.",
    });
  }

  try {
    //check if existing employee
    let existingEmployee = await User.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: "Employee with email exists." });
    }

    //generate a unique custom id for the employee
    let customEmployeeId = generateEmployeeId();
    let idExists = await User.findOne({ customEmployeeId });

    while (idExists) {
      //generate new id if already exists
      customEmployeeId = generateEmployeeId();
      idExists = await User.findOne({ customEmployeeId });
    }

    //create new employee instance
    const newEmployee = new User({
      firstName,
      lastName,
      email,
      password: defaultPassword,
      role: "employee",
      customEmployeeId,
      language,
      location,
      isActive: false,
    });

    const employee = await newEmployee.save();

    //response of request should not contain password
    const responseEmployee = employee.toObject();
    delete responseEmployee.password;

    res.status(201).json(responseEmployee);
  } catch (err) {
    console.error("Error creating employee:", err);

    // Handle Mongoose validation errors (e.g., enum values, required fields)
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Server error: Could not create employee." });
  }
};

//update a user (admin and employee can access this route)
//PATCH /api/employees/:id
const editUser = async (req, res) => {
  const id = req.params.id;
  const {
    role,
    customEmployeeId,
    password,
    language,
    location,
    isActive,
    ...updates
  } = req.body;

  try {
    // disallow updates to certain fields
    if (
      role !== undefined ||
      customEmployeeId !== undefined ||
      password !== undefined ||
      isActive !== undefined ||
      language !== undefined ||
      location !== undefined
    ) {
      return res.status(400).json({
        message:
          "Role, customEmployeeId, password, isActive, language, and location cannot be updated via this route. Use specific routes for password updates.",
      });
    }

    // Find employee
    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found." });
    }

    // If email updated, it should not match with existing email of another user
    if (updates.email && updates.email !== employee.email) {
      const existingUserWithEmail = await User.findOne({
        email: updates.email,
      });
      if (
        existingUserWithEmail &&
        existingUserWithEmail._id.toString() !== id
      ) {
        return res
          .status(400)
          .json({ message: "Another employee already uses this email." });
      }
    }

    // Apply allowed updates (firstName, lastName, email)
    Object.assign(employee, updates);
    await employee.save();

    // Response should not contain password
    const responseEmployee = employee.toObject();
    delete responseEmployee.password;

    res.status(200).json(responseEmployee);
  } catch (err) {
    console.error("Error updating employee:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Server error: Could not update employee." });
  }
};

//delete user
//DELETE /api/employees/:id
const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;

    // Find employee
    const employee = await User.findById(id);

    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ error: "Employee not found." });
    }

    // redistribute leads before deleting the employee
    await redistributeLeads(id);
    console.log(`Leads redistributed for employee ${id} before deletion.`);

    //deleting employee from DB
    await employee.deleteOne();
    res.status(200).json({ message: "Employee deleted successfully." });
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ error: "Server error: Could not delete employee." });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  editUser,
  deleteUser,
};
