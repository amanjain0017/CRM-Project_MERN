import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// fetch employee dashboard data
export const fetchEmployeeDashboardData = createAsyncThunk(
  "employeeDashboard/fetchEmployeeDashboardData",
  async (employeeId, { rejectWithValue }) => {
    try {
      // Fetch today's attendance record
      const attendanceResponse = await axios.get(
        `${BACKEND_URL}/api/employee/${employeeId}/attendance`
      );
      const attendanceData = attendanceResponse.data;

      // Fetch breaks history (all past breaks)
      const breaksHistoryResponse = await axios.get(
        `${BACKEND_URL}/api/employee/${employeeId}/breaks/history`
      );
      const pastBreaks = breaksHistoryResponse.data;

      // Fetch recent activities for this employee
      const activitiesResponse = await axios.get(
        `${BACKEND_URL}/api/employee/${employeeId}/recent-activities`
      );
      const recentActivities = activitiesResponse.data;

      // --- Derive current timing status from attendance data ---
      // This logic now relies on the comprehensive data from getEmployeeAttendance
      let currentTiming = {
        checkIn: attendanceData.firstCheckIn || null,
        checkOut: attendanceData.finalCheckOut || null,
        onBreak: attendanceData.onBreak || false, // Directly from backend response
        breakStartTime: attendanceData.breakStartTime || null, // Directly from backend response
        isActive: attendanceData.isActive || false, // Overall active status from backend
      };

      return {
        currentTiming: currentTiming,
        pastBreaks: pastBreaks,
        recentActivities: recentActivities,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Employee Check-In
export const employeeCheckIn = createAsyncThunk(
  "employeeDashboard/checkIn",
  async (employeeId, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/employee/${employeeId}/check-in`
      );
      // Re-fetch dashboard data to update UI with new status
      dispatch(fetchEmployeeDashboardData(employeeId));
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return rejectWithValue(message);
    }
  }
);

// Employee Start Break
export const employeeStartBreak = createAsyncThunk(
  "employeeDashboard/startBreak",
  async (employeeId, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/employee/${employeeId}/start-break`
      );
      dispatch(fetchEmployeeDashboardData(employeeId));
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return rejectWithValue(message);
    }
  }
);

// Employee End Break
export const employeeEndBreak = createAsyncThunk(
  "employeeDashboard/endBreak",
  async (employeeId, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/employee/${employeeId}/end-break`
      );
      dispatch(fetchEmployeeDashboardData(employeeId));
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return rejectWithValue(message);
    }
  }
);

// Employee Final Check-Out
export const employeeFinalCheckOut = createAsyncThunk(
  "employeeDashboard/finalCheckOut",
  async (employeeId, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/employee/${employeeId}/final-check-out`
      );
      dispatch(fetchEmployeeDashboardData(employeeId)); // Re-fetch to show final checkout state
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return rejectWithValue(message);
    }
  }
);

const employeeDashboardSlice = createSlice({
  name: "employeeDashboard",
  initialState: {
    profile: null,
    currentTiming: {
      checkIn: null,
      checkOut: null,
      onBreak: false,
      breakStartTime: null,
      isActive: false, // Overall active status
    },
    pastBreaks: [],
    recentActivities: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearEmployeeDashboardError: (state) => {
      state.error = null;
    },
    setProfileData: (state, action) => {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTiming = action.payload.currentTiming;
        state.pastBreaks = action.payload.pastBreaks;
        state.recentActivities = action.payload.recentActivities;
      })
      .addCase(fetchEmployeeDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload || "Failed to fetch employee dashboard data.";
      })
      // Handle pending/rejected for new attendance actions (fulfilled handled by re-fetch)
      .addCase(employeeCheckIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(employeeCheckIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(employeeStartBreak.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(employeeStartBreak.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(employeeEndBreak.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(employeeEndBreak.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(employeeFinalCheckOut.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(employeeFinalCheckOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEmployeeDashboardError, setProfileData } =
  employeeDashboardSlice.actions;
export default employeeDashboardSlice.reducer;
