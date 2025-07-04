const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/userModel"); // Assuming models/userModel.js is directly inside server/models/

dotenv.config();

const users = [
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
    customEmployeeId: "CRMADMIN001",
    language: "English",
    location: "Delhi",
    isActive: true,
  },
];

const seedDatabase = async () => {
  try {
    console.log(
      "Attempting to connect with MONGO_URI:",
      process.env.MONGO_URI
        ? "***** (URI loaded)"
        : "Undefined (URI not loaded)"
    );

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected for seeding...");

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
