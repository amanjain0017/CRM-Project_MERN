const Lead = require("../models/leadModel");
const User = require("../models/userModel");

// Helper function for lead distribution logic : based on a 3 tier priority
// priority order is as follows : lang and location match, lang or location match, equal distribution
const assignLeadAutomatically = async (lead) => {
  try {
    // Retrieves all employee (id, lang and location)
    const allEmployees = await User.find({ role: "employee" }).select(
      "_id language location"
    );

    // no employees Scenario
    if (allEmployees.length === 0) {
      console.warn(
        `No employees available to assign lead ${lead._id}. Lead remains unassigned.`
      );
      return null; // 'assignedTo' field will remain null.
    }

    let eligibleEmployees = []; // array to hold employees who match the priority tier.

    // 3-Tier Priority Distribution : array of "eligible" employees for the current lead
    // Priority 1: Exact match (language AND location)
    const exactMatchEmployees = allEmployees.filter(
      (emp) => emp.language === lead.language && emp.location === lead.location
    );

    if (exactMatchEmployees.length > 0) {
      eligibleEmployees = exactMatchEmployees; // highest priority candidates.
      console.log(
        `Lead ${lead._id}: Exact match found for automatic assignment.`
      );
    } else {
      // Priority 2: Partial match (language OR location)
      const partialMatchEmployees = allEmployees.filter(
        (emp) =>
          emp.language === lead.language || emp.location === lead.location
      );

      if (partialMatchEmployees.length > 0) {
        eligibleEmployees = partialMatchEmployees; // second priority candidates.
        console.log(
          `Lead ${lead._id}: Partial match found for automatic assignment.`
        );
      } else {
        // Priority 3: No match, distribute among ALL employees
        eligibleEmployees = allEmployees; // third priority candidates.
        console.log(
          `Lead ${lead._id}: No specific match, distributing among all employees.`
        );
      }
    }

    // fallback case
    if (eligibleEmployees.length === 0) {
      console.warn(
        `No eligible employees found after filtering for lead ${lead._id}. Lead remains unassigned.`
      );
      return null;
    }

    // Find Employee with fewest Pending Leads amongst eligble employees

    // pending leads counts of eligible employees
    const employeeLeadCounts = await Promise.all(
      eligibleEmployees.map(async (employee) => {
        const count = await Lead.countDocuments({
          assignedTo: employee._id,
          status: "Pending",
        });
        return { employeeId: employee._id, count };
      })
    );

    // Sort the employees by pending lead count
    employeeLeadCounts.sort((a, b) => a.count - b.count);

    // Assign the Lead to the Employee with the Fewest Pending Leads
    const assignedEmployeeId = employeeLeadCounts[0].employeeId;
    lead.assignedTo = assignedEmployeeId;

    await lead.save();
    console.log(
      `Lead ${lead._id} automatically assigned to ${assignedEmployeeId}`
    );

    return assignedEmployeeId;
  } catch (error) {
    console.error("Error during automatic lead assignment:", error);
    return null;
  }
};

// Helper function for re-distributing leads when an employee is deleted. no priority present
const redistributeLeads = async (deletedEmployeeId) => {
  try {
    // get pending leads of deleted employee
    const leadsToRedistribute = await Lead.find({
      assignedTo: deletedEmployeeId,
      status: "Pending",
    });

    // No Leads to Redistribute
    if (leadsToRedistribute.length === 0) {
      console.log(
        `No pending leads to redistribute for employee ${deletedEmployeeId}.`
      );
      return;
    }

    // Get All Remaining Employees
    const remainingEmployees = await User.find({
      role: "employee",
      _id: { $ne: deletedEmployeeId },
    }).select("_id");

    // No Remaining Employees Scenario
    if (remainingEmployees.length === 0) {
      console.warn(
        `No remaining employees to redistribute leads to. Leads will become unassigned.`
      );
      await Lead.updateMany(
        { assignedTo: deletedEmployeeId, status: "Pending" },
        { $set: { assignedTo: null } }
      );
      return;
    }

    // Assign to employee with fewest pending leads
    // pending lead counts for remaining employees
    const employeeLeadCounts = await Promise.all(
      remainingEmployees.map(async (employee) => {
        const count = await Lead.countDocuments({
          assignedTo: employee._id,
          status: "Pending",
        });
        return { employeeId: employee._id, count };
      })
    );

    // Iterate through each lead that needs to be redistributed
    for (const lead of leadsToRedistribute) {
      // Sort employees by their current pending lead count
      employeeLeadCounts.sort((a, b) => a.count - b.count);

      const targetEmployee = employeeLeadCounts[0];
      lead.assignedTo = targetEmployee.employeeId;

      await lead.save();

      targetEmployee.count++;

      console.log(
        `Lead '${lead._id}' reassigned to employee '${targetEmployee.employeeId}' (now has ${targetEmployee.count} pending leads).`
      );
    }

    console.log(
      `Redistributed ${leadsToRedistribute.length} leads from deleted employee ${deletedEmployeeId} to remaining employees based on dynamic least pending lead count.`
    );
  } catch (error) {
    console.error("Error during lead redistribution:", error);
  }
};

//helper function to generate a custom employeeID
const generateEmployeeId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "#CANOVA";
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};

// Helper function to get today's date normalized to UTC midnight
const getTodayUtcMidnight = () => {
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
  return today;
};

module.exports = {
  assignLeadAutomatically, // needed for lead management
  redistributeLeads, // needed when employee deleted
  generateEmployeeId, // needed for creating employee
  getTodayUtcMidnight, // for check in / check out
};
