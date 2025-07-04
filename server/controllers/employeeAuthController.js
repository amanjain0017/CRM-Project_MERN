const User = require("../models/userModel"); // Assuming your User model is in ../models/userModel.js
const bcrypt = require("bcryptjs"); // For secure password comparison

// Authenticate employee
// POST /api/employee/auth/login
const employeeLogin = async (req, res) => {
  const { email, password } = req.body;

  // Input Validation
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please enter all fields (email and password)." });
  }

  try {
    // Find User by Email and Role
    const user = await User.findOne({ email, role: "employee" }).select(
      "+password"
    );

    // user doesnt exist or not a employee
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid credentials or user is not an employee." });
    }

    // Compare Passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    //Send Success Response with User Data
    res.json({
      message: "Login successful!",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        customEmployeeId: user.customEmployeeId,
        language: user.language,
        location: user.location,
        isActive: user.isActive, // Still include isActive in response, as it's a user attribute
      },
    });
  } catch (error) {
    console.error("Error during employee login:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};

module.exports = {
  employeeLogin,
};
