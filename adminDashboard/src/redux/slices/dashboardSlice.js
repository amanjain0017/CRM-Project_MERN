import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = "http://localhost:4000";

// Dashboard Data
export const fetchOverallSummary = createAsyncThunk(
  "dashboard/fetchOverallSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/admin/dashboard/summary`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

//employee performance
export const fetchEmployeePerformance = createAsyncThunk(
  "dashboard/fetchEmployeePerformance",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/admin/dashboard/employee-performance`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

//daily closed leads
export const fetchDailyClosedLeads = createAsyncThunk(
  "dashboard/fetchDailyClosedLeads",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/admin/dashboard/daily-closed-leads`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

//recent activities
export const fetchRecentActivities = createAsyncThunk(
  "dashboard/fetchRecentActivities",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/admin/dashboard/recent-activities`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    summary: null,
    employeePerformance: [],
    dailyClosedLeads: [],
    recentActivities: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle overall summary
      .addCase(fetchOverallSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOverallSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchOverallSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch dashboard summary.";
      })
      // Handle employee performance
      .addCase(fetchEmployeePerformance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployeePerformance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employeePerformance = action.payload;
      })
      .addCase(fetchEmployeePerformance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch employee performance.";
      })
      // Handle daily closed leads
      .addCase(fetchDailyClosedLeads.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDailyClosedLeads.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dailyClosedLeads = action.payload;
      })
      .addCase(fetchDailyClosedLeads.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch daily closed leads.";
      })
      // Handle recent activities
      .addCase(fetchRecentActivities.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recentActivities = action.payload;
      })
      .addCase(fetchRecentActivities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch recent activities.";
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
