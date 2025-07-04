// lead model
const mongoose = require("mongoose");

//lead schema along with timestamp
const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows null/missing email if phone present
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows null/missing phone if email present
    },
    status: {
      type: String,
      enum: ["Pending", "Closed"],
      default: "Pending",
    },
    leadType: {
      type: String,
      enum: ["Hot", "Warm", "Cold"],
      default: "Warm",
    },
    language: {
      type: String,
      required: true,
      trim: true,
      enum: ["Hindi", "English", "Bengali", "Tamil"],
    },
    location: {
      type: String,
      required: true,
      trim: true,
      enum: ["Pune", "Hyderabad", "Delhi"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // References 'User' model
      default: null,
    },
    receivedDate: {
      // acquisition date of lead
      type: Date,
      default: Date.now, //current date if not provided
    },
    scheduledDate: {
      type: Date,
      default: null, // Null if not scheduled
    },
    scheduledTime: {
      type: String, // as "HH:MM" string
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Lead = mongoose.model("Lead", leadSchema);

module.exports = Lead;
