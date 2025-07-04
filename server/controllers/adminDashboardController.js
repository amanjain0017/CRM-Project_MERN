const Lead = require("../models/leadModel");
const User = require("../models/userModel");

// Get overall CRM summary statistics for Admin Dashboard
// GET /api/admin/dashboard/summary
const getOverallSummary = async (req, res) => {
  try {
    // Total Leads
    const totalLeads = await Lead.countDocuments();

    // Leads Assigned in Last Week
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const leadsAssignedLastWeek = await Lead.countDocuments({
      assignedTo: { $ne: null }, // must be assigned
      createdAt: { $gte: sevenDaysAgo }, // created within the last 7 days
    });

    // Converted Leads (Leads with status 'Closed')
    const convertedLeads = await Lead.countDocuments({ status: "Closed" });

    // Unassigned Leads (Leads with assignedTo: null)
    const unassignedLeads = await Lead.countDocuments({ assignedTo: null });

    // Active Employees (User.isActive: true)
    const activeEmployees = await User.countDocuments({
      role: "employee",
      isActive: true,
    });

    // Total Employees
    const totalEmployees = await User.countDocuments({ role: "employee" });

    // Conversion Rate: (Converted Leads / Total Leads) * 100
    const conversionRate =
      totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

    res.json({
      unassignedLeads,
      totalLeads,
      leadsAssignedLastWeek,
      convertedLeads,
      activeEmployees,
      totalEmployees,
      conversionRate: parseFloat(conversionRate),
    });
  } catch (error) {
    console.error("Error fetching overall summary:", error);
    res
      .status(500)
      .json({ message: "Server error: Couldn't retrieve summary." });
  }
};

// Get performance metrics for all employees for Admin Dashboard
// GET /api/admin/dashboard/employee-performance
const getEmployeePerformance = async (req, res) => {
  try {
    // Fetch All Employees
    const employees = await User.find({ role: "employee" }).select(
      "_id firstName lastName email customEmployeeId isActive"
    );

    // Calculate Performance Metrics for Each Employee
    const performanceData = await Promise.all(
      employees.map(async (employee) => {
        // Count Assigned Leads
        const assignedLeads = await Lead.countDocuments({
          assignedTo: employee._id,
        });

        // Count Converted Leads
        const convertedLeads = await Lead.countDocuments({
          assignedTo: employee._id,
          status: "Closed",
        });

        // Count Pending Leads
        const pendingLeads = await Lead.countDocuments({
          assignedTo: employee._id,
          status: "Pending",
        });

        // Calculate Individual Conversion Rate
        const conversionRate =
          assignedLeads > 0
            ? ((convertedLeads / assignedLeads) * 100).toFixed(2)
            : 0;

        // Return Employee Performance with their details
        return {
          _id: employee._id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          customEmployeeId: employee.customEmployeeId,
          isActive: employee.isActive,
          assignedLeads,
          convertedLeads,
          pendingLeads,
          conversionRate: parseFloat(conversionRate),
        };
      })
    );

    // Sort Performance Data : admin will see employee info of most assigned leads first
    performanceData.sort((a, b) => b.assignedLeads - a.assignedLeads);

    // Send JSON array of computed performance data for all employees
    res.json(performanceData);
  } catch (error) {
    console.error("Error fetching employee performance:", error);

    res.status(500).json({
      message: "Server error: Could not get employee performance data.",
    });
  }
};

// Get a list of recent lead-related activities for Admin Dashboard
// GET /api/admin/dashboard/recent-activities
const getRecentActivities = async (req, res) => {
  try {
    // Fetch leads
    const recentLeads = await Lead.find({})
      .sort({ updatedAt: -1 }) // Sort by last update time descending
      .limit(10) // recent 10 activities
      .populate("assignedTo", "firstName lastName") // Populate assigned employee name
      .select("name status assignedTo createdAt updatedAt"); // Select relevant fields

    const activities = recentLeads.map((lead) => {
      let description = "";
      const employeeName = lead.assignedTo
        ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
        : "an employee";

      // Determine activity type based on changes or creation
      const isCreatedEvent =
        lead.createdAt.getTime() === lead.updatedAt.getTime() ||
        Math.abs(lead.createdAt.getTime() - lead.updatedAt.getTime()) < 100;

      if (isCreatedEvent) {
        // Lead Creation
        description = `You added '${lead.name}' as a lead.`;
      } else if (lead.status === "Closed") {
        // Lead Closure
        description = `${employeeName} closed a deal.`;
      } else if (lead.assignedTo) {
        // Lead assigning : reassignments (from employee deletion) or initial assignments with slight delay in updatedAt
        description = `You assigned a lead to ${employeeName} `;
      } else {
        // Fallback for other updates
        description = `Lead '${lead.name}' was updated.`;
      }

      return {
        leadId: lead._id,
        leadName: lead.name,
        activity: description,
        timestamp: lead.updatedAt, // Use updatedAt for activity timestamp
      };
    });

    const filteredActivities = activities.filter(
      (activity) =>
        activity.activity !== `Lead '${activity.leadName}' was updated.`
    );

    res.json(filteredActivities); // Send filtered activities
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res
      .status(500)
      .json({ message: "Server error: Could not retrieve recent activities." });
  }
};

// Get the number of leads closed per day for charting (last 14 days)
// GET /api/admin/dashboard/daily-closed-leads
const getDailyClosedLeads = async (req, res) => {
  try {
    // timeframe (Last 14 Days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // MongoDB Aggregation Pipeline
    // Example output from aggregation :  [ { date: '2025-06-25', count: 5 }, { date: '2025-06-26', count: 3 }, ... ]
    const dailyClosedLeads = await Lead.aggregate([
      {
        // Stage 1: $match - Filter Documents that meet specific criteria
        $match: {
          status: "Closed",
          updatedAt: { $gte: fourteenDaysAgo }, // Filter by updated within last 14 days
        },
      },
      {
        // Stage 2: $group - Group Documents (updatededAt) and Apply Accumulators (count)
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" }, // Formats date to "YYYY-MM-DD" string
          },
          count: { $sum: 1 }, // Counts leads for each day
        },
      },
      {
        // Stage 3: $sort - Sort Documents
        $sort: {
          _id: 1, // Sort by the date string (which is our _id)
        },
      },
      {
        // Stage 4: $project - Reshape Documents (to be more readable and directly usable by the frontend)
        $project: {
          _id: 0, // Exclude the default _id field
          date: "$_id", // Rename _id (the date string) to 'date'
          count: 1, // Include the count
        },
      },
    ]);

    // Fill Missing Dates with Zero Count for Continuous Chart Data
    const filledData = [];
    let currentDate = new Date(fourteenDaysAgo); // Initialize start date (14 days ago)
    currentDate.setHours(0, 0, 0, 0); // beginning of that day

    const today = new Date();
    today.setHours(0, 0, 0, 0); // beginning of the current day

    // Create a Map for quick lookup of counts for specific dates.
    const dataMap = new Map(
      dailyClosedLeads.map((item) => [item.date, item.count])
    );

    // Loop from the start date (14 days ago) up to and including the current day.
    while (currentDate <= today) {
      // Format the current date to "YYYY-MM-DD" to match the aggregation output.
      const dateString = currentDate.toISOString().slice(0, 10);
      filledData.push({
        date: dateString,
        count: dataMap.get(dateString) || 0, // Get the count from the map, or default to 0
      });
      currentDate.setDate(currentDate.getDate() + 1); // Move to next day
    }

    // Send final array of daily closed lead counts
    res.json(filledData);
  } catch (error) {
    console.error("Error fetching daily closed leads:", error);
    res.status(500).json({
      message: "Server error: Could not retrieve daily closed leads data.",
    });
  }
};

// Get the profile of the single admin user
// GET /api/admin/dashboard/profile
const getAdminProfile = async (req, res) => {
  try {
    // Find the single admin user
    const adminUser = await User.findOne({ role: "admin" }).select(
      "-password -__v"
    );

    if (!adminUser) {
      return res.status(404).json({ message: "Admin user not found." });
    }

    res.status(200).json(adminUser);
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res
      .status(500)
      .json({ message: "Server error: Could not retrieve admin profile." });
  }
};

module.exports = {
  getOverallSummary,
  getEmployeePerformance,
  getDailyClosedLeads,
  getRecentActivities,
  getAdminProfile,
};
