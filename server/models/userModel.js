// user model : admin and employees (1 to n mapping)
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // password hashing

//user schema along with timestamp
const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: true,
    },
    lastName: {
      type: String,
      trim: true,
      required: true,
    },
    customEmployeeId: {
      // generated for employees (readable ID)
      type: String,
      unique: true,
      trim: true,
      required: true,
    },
    email: {
      // primary unique identifier for all users
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "employee"],
      required: true,
    },
    language: {
      type: String,
      enum: ["Hindi", "English", "Bengali", "Tamil"],
      default: "English",
    },
    location: {
      type: String,
      enum: ["Pune", "Hyderabad", "Delhi"],
      default: "Delhi",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// pre-save hook to hash password before saving a new user or updating password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//compare the entered password to hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//user model using userSchema
const User = new mongoose.model("User", userSchema);

module.exports = User;
