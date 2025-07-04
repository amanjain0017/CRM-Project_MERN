const mongoose = require("mongoose");

const workPeriodSchema = mongoose.Schema({
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    default: null, // Null if currently active
  },
});

const breakSchema = mongoose.Schema({
  breakStart: {
    type: Date,
    required: true,
  },
  breakEnd: {
    type: Date,
    default: null, // Null if currently active
  },
});

const attendanceSchema = mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // References the User model (employees)
    },
    date: {
      type: Date,
      required: true,
      // Ensure only one attendance record per employee per day
      unique: true,
      index: true, // Index for faster date lookups
    },
    firstCheckIn: {
      type: Date,
      default: null, // The very first check-in of the day
    },
    finalCheckOut: {
      type: Date,
      default: null, // The very last check-out of the day
    },
    workPeriods: [workPeriodSchema], // Array of work sessions (start, end)
    breaks: [breakSchema], // Array of break sessions (start, end)
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound index to ensure uniqueness for employee and date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
