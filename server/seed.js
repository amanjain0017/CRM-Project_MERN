// backend/seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/userModel"); // Adjust path if needed

dotenv.config({ path: "./backend/.env" }); // Load .env from backend folder

const users = [
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    password: "password123", // This will be hashed by the pre-save hook
    role: "admin",
    customEmployeeId: "CRMADMIN001",
    language: "English",
    location: "Headquarters",
    isActive: false, // Admin is not an "active" employee in terms of attendance
  },
  // You can add more initial users/employees here if needed
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected for seeding...");

    // Clear existing users (OPTIONAL - use with caution in production!)
    // If you run this multiple times, it will delete existing data.
    // For initial setup, it's fine, but comment out or remove after first run.
    await User.deleteMany({});
    console.log("Existing users cleared (if any).");

    // Insert new users
    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create(userData);
        console.log(`User ${userData.email} created.`);
      } else {
        console.log(`User ${userData.email} already exists. Skipping.`);
      }
    }

    console.log("Database seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
