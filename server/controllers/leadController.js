const Lead = require("../models/leadModel");
const User = require("../models/userModel"); // to interact with employees for assignment
const csv = require("csv-parser");
const { Readable } = require("stream");

// Import helper functions
const { assignLeadAutomatically } = require("../utils/helpers");

// Add a single lead manually
// POST /api/leads/manual
const createLeadManual = async (req, res) => {
  const { name, email, phone, language, location, receivedDate } = req.body;

  // essential fields
  if (!name || !language || !location) {
    return res.status(400).json({
      message: "Name, language, and location are required for a new lead.",
    });
  }

  // at least one of email or phone must be present
  if (!email && !phone) {
    return res.status(400).json({
      message: "At least one of email or phone must be provided for new lead.",
    });
  }

  try {
    // check for existing lead by email or phone (if provided)
    if (email) {
      const existingLead = await Lead.findOne({ email });
      if (existingLead) {
        return res
          .status(400)
          .json({ message: "Lead with this email already exists." });
      }
    }
    if (phone) {
      const existingLead = await Lead.findOne({ phone });
      if (existingLead) {
        return res
          .status(400)
          .json({ message: "Lead with this phone number already exists." });
      }
    }

    const newLead = new Lead({
      name,
      email: email || null,
      phone: phone || null,
      language,
      location,
      receivedDate: receivedDate ? new Date(receivedDate) : undefined,
    });

    await newLead.save();
    await assignLeadAutomatically(newLead); // automatic assignment

    // Populate assignedTo for the response
    const populatedLead = await Lead.findById(newLead._id).populate(
      "assignedTo",
      "firstName lastName email"
    );

    res.status(201).json(populatedLead);
  } catch (error) {
    console.error("Error adding lead manually:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ message: "Server error: Could not add lead." });
  }
};

// Upload leads via CSV file (parsing, validation and lead distribution)
// POST /api/leads/upload
const uploadLeadsCSV = async (req, res) => {
  const { csvData } = req.body; // csvData is expected as a string

  if (!csvData) {
    return res.status(400).json({ message: "CSV data is required." });
  }

  //data structure for processing and reporting
  const leadsToProcess = []; //initially validated leads and are eligible for db level checks
  const processedResults = {
    totalLeadsInCsv: 0,
    validLeadsCount: 0,
    insertedLeadsCount: 0,
    unassignedLeadsCount: 0, // Leads that failed direct CSV assignment
    errors: [], //error mssgs for rows that failed db insertion
    discardedRows: [], //rows that failed intial validation
  };

  //readable stream to parse csv data
  const stream = Readable.from(csvData);

  //pipe stream to csv-parser() to process data row by row
  //   '.on('data', ...)' event listener is triggered for each row successfully parsed from the CSV.
  stream
    .pipe(csv())
    .on("data", (row) => {
      processedResults.totalLeadsInCsv++; // new row

      // intial validation 1: discard if name, language, or location are missing
      if (!row.name || !row.language || !row.location) {
        processedResults.discardedRows.push({
          row,
          message: "Discarded: Missing a required field.",
        });
        return;
      }

      // intial validation 2: discard if both email AND phone are missing
      if (!row.email && !row.phone) {
        processedResults.discardedRows.push({
          row,
          message:
            "Discarded: At least one of email or phone must be provided.",
        });
        return;
      }

      //intial validation 3: discard if invalid date AND set as current date if empty
      let parsedReceivedDate = new Date(); // Default to current date
      if (row.receivedDate) {
        const date = new Date(row.receivedDate);
        if (!isNaN(date.getTime())) {
          parsedReceivedDate = date;
        } else {
          processedResults.discardedRows.push({
            row,
            message: `Discarded: Invalid receivedDate format.`,
          });

          return;
        }
      }

      //row that passed intial validations and is prepared for batch processing
      leadsToProcess.push({
        name: row.name,
        email: row.email ? row.email.trim().toLowerCase() : null,
        phone: row.phone ? row.phone.trim() : null,
        language: row.language,
        location: row.location,
        receivedDate: parsedReceivedDate,
        assignedEmployeeName: row.assignedEmployee
          ? row.assignedEmployee.trim()
          : null, // Capture full name
      });
    })
    .on("end", async () => {
      //process leads after all csv has been parsed

      //no valid leads in csv
      if (leadsToProcess.length === 0) {
        return res.status(400).json({
          message:
            "No valid leads found in CSV after initial parsing, or CSV is empty.",
          ...processedResults,
        });
      }

      //update validLeadsCount
      processedResults.validLeadsCount = leadsToProcess.length;

      //iterate and insert valid leads into db
      for (const leadData of leadsToProcess) {
        try {
          // DB Check 1 : duplicate email
          if (leadData.email) {
            const existingLead = await Lead.findOne({ email: leadData.email });
            if (existingLead) {
              processedResults.errors.push({
                row: leadData,
                message: `Duplicate email: ${leadData.email} already exists.`,
              });
              continue; // Skip to next lead
            }
          }

          // DB Check 2 : duplicate phone
          if (leadData.phone) {
            const existingLead = await Lead.findOne({ phone: leadData.phone });
            if (existingLead) {
              processedResults.errors.push({
                row: leadData,
                message: `Duplicate phone: ${leadData.phone} already exists.`,
              });
              continue; // Skip to next lead
            }
          }

          //create new db lead document instance for inserting
          const newLead = new Lead({
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone,
            language: leadData.language,
            location: leadData.location,
            receivedDate: leadData.receivedDate,
          });

          // Attempt direct assignment from CSV if employee name is provided
          if (leadData.assignedEmployeeName) {
            //split full name to first and last name
            const nameParts = leadData.assignedEmployeeName.split(" ");
            const firstName = nameParts[0];
            const lastName =
              nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

            // Find the employee by firstName and lastName (case-insensitive) and role as employee
            const employee = await User.findOne({
              firstName: new RegExp(`^${firstName}$`, "i"), // Exact match for first name, case-insensitive
              lastName: new RegExp(`^${lastName}$`, "i"), // Exact match for last name, case-insensitive
              role: "employee",
            });

            if (employee) {
              //  matching employee is found
              newLead.assignedTo = employee._id; // Assign the lead to employee
              console.log(
                `Lead '${newLead.name}' directly assigned to ${employee.firstName} ${employee.lastName} from CSV.`
              );
            } else {
              // employee not found
              newLead.assignedTo = null;
              processedResults.unassignedLeadsCount++;
              processedResults.errors.push({
                row: leadData,
                message: `Employee with name '${leadData.assignedEmployeeName}' not found or not a employee. Lead is unassigned.`,
              });
              console.warn(
                `Lead '${newLead.name}': Employee with name '${leadData.assignedEmployeeName}' not found or not an employee. Lead is unassigned.`
              );
            }
          }

          processedResults.insertedLeadsCount++;
          await newLead.save();

          // automatic assignment only when lead was not directly assigned by csv(or employee was invalid)
          if (!leadData.assignedEmployeeName && !newLead.assignedTo) {
            await assignLeadAutomatically(newLead);
          }
        } catch (insertError) {
          //for database-related errors while inserting the lead to db
          console.error(
            "Error processing lead from CSV:",
            leadData.name,
            insertError
          );

          processedResults.errors.push({
            row: leadData,
            message: `Database error during insert: ${insertError.message}`,
          });
        }
      }

      //send response after all leads are processed
      res.status(200).json({
        message: `CSV upload complete. ${processedResults.insertedLeadsCount} leads inserted.`,
        ...processedResults, // Return all collected stats and errors
      });
    })
    .on("error", (error) => {
      //for handling the csv stream related errors
      console.error("Error parsing CSV stream:", error);
      res.status(500).json({ message: "Error processing CSV file stream." });
    });
};

// Get all leads (also handles filters ,search, and pagination)
// GET /api/leads
const getAllLeads = async (req, res) => {
  //destructure query parameters
  const {
    status,
    assignedTo,
    language,
    location,
    leadType,
    search,
    page = 1,
    limit = 6,
    filterBy,
    isScheduledOnly,
  } = req.query;

  // Build filter object
  const filter = {}; //empty object to handle filter for our leads

  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (language) filter.language = language;
  if (location) filter.location = location;
  if (leadType) filter.leadType = leadType;

  if (isScheduledOnly === "true") {
    filter.scheduledDate = { $ne: null };
    filter.scheduledTime = { $ne: null };
    filter.status = { $ne: "Closed" }; // Scheduled leads should not be closed
  }

  // filter logic
  if (filterBy === "Today" && assignedTo && isScheduledOnly === "true") {
    //  scheduled leads
    const today = new Date();
    today.setHours(0, 0, 0, 0); // beginning of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // beginning of tomorrow

    filter.scheduledDate = {
      $gte: today,
      $lt: tomorrow,
    };
  }

  // Search across multiple fields (name, email, phone, language, location, assignedTo name/email)
  if (search) {
    const searchRegex = { $regex: search, $options: "i" }; // Case-insensitive search
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { language: searchRegex },
      { location: searchRegex },
      { leadType: searchRegex },
      { status: searchRegex },
    ];
  }

  try {
    //pagination parameters
    const pageNum = parseInt(page, 6);
    const limitNum = parseInt(limit, 6);
    const skip = (pageNum - 1) * limitNum;

    // Fetch leads with filters, pagination and populate assignedTo details
    const leads = await Lead.find(filter)
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: -1 }) //by creation date desc
      .skip(skip)
      .limit(limitNum);

    const totalLeads = await Lead.countDocuments(filter);

    res.json({
      leads,
      currentPage: pageNum,
      totalPages: Math.ceil(totalLeads / limitNum),
      totalResults: totalLeads,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ message: "Server error: Could not get leads." });
  }
};

// Get single lead by ID
// GET /api/leads/:id
const getLeadById = async (req, res) => {
  try {
    const id = req.params.id;

    //replace assignedTo (employee ID) of lead with assigned employee name and email by referencing user collection
    const lead = await Lead.findById(id).populate(
      "assignedTo",
      "firstName lastName email"
    );
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    res.status(200).json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    res.status(500).json({ message: "Server error: Could not get lead." });
  }
};

// Update lead details (status, assignedTo, leadType, receivedDate, name, email, phone, scheduledDate, scheduledTime)
// PATCH /api/leads/:id
const updateLead = async (req, res) => {
  const {
    status,
    leadType,
    scheduledDate,
    scheduledTime,
    ...unallowedUpdates
  } = req.body;

  //certain fields are made immutable for now
  if (
    req.body.name !== undefined ||
    req.body.email !== undefined ||
    req.body.phone !== undefined ||
    req.body.receivedDate !== undefined
  ) {
    return res.status(400).json({
      message:
        "Name, email, phone, and receivedDate cannot be updated for a lead.",
    });
  }

  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    //handle status update (has a constraint)
    if (status && lead.status !== status) {
      // lead scheduled for future cant be closed.
      if (status === "Closed" && lead.scheduledDate && lead.scheduledTime) {
        const [hours, minutes] = lead.scheduledTime.split(":").map(Number);
        const scheduledDateTime = new Date(lead.scheduledDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);

        if (scheduledDateTime > new Date()) {
          // If scheduled time is in the future
          return res.status(400).json({
            message: "Lead cant be closed if scheduled in the future.",
          });
        }
      }
      lead.status = status;
    }

    //handle leadType update
    if (leadType && lead.leadType !== leadType) {
      lead.leadType = leadType;
    }

    // Handle scheduledDate and scheduledTime
    if (scheduledDate !== undefined || scheduledTime !== undefined) {
      if (
        scheduledDate === null ||
        scheduledTime === null ||
        (scheduledDate === "" && scheduledTime === "")
      ) {
        // clear schedule if both are explicitly null/empty
        lead.scheduledDate = null;
        lead.scheduledTime = null;
      } else if (scheduledDate && scheduledTime) {
        const [hours, minutes] = scheduledTime.split(":").map(Number);
        const newScheduledDateTime = new Date(scheduledDate);
        newScheduledDateTime.setHours(hours, minutes, 0, 0);

        // Check overlapping schedules for same employee (we assume lead is assigned already)
        if (lead.assignedTo) {
          const existingOverlap = await Lead.findOne({
            _id: { $ne: lead._id }, // Exclude current lead
            assignedTo: lead.assignedTo,
            status: { $ne: "Closed" }, // Only check for active/pending leads
            scheduledDate: newScheduledDateTime,
            scheduledTime: scheduledTime,
          });

          if (existingOverlap) {
            return res.status(400).json({
              message: "Another lead scheduled at same time for employee.",
            });
          }
        }

        lead.scheduledDate = newScheduledDateTime;
        lead.scheduledTime = scheduledTime;
      } else {
        return res.status(400).json({
          message:
            "Both scheduledDate and scheduledTime must be provided to set a schedule.",
        });
      }
    }

    await lead.save();

    // Populate assignedTo for response
    const updatedLead = await Lead.findById(req.params.id).populate(
      "assignedTo",
      "firstName lastName email"
    );

    res.json(updatedLead);
  } catch (error) {
    console.error("Error updating lead:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ message: "Server error: Could not update lead." });
  }
};

module.exports = {
  createLeadManual,
  uploadLeadsCSV,
  getAllLeads,
  getLeadById,
  updateLead,
};
