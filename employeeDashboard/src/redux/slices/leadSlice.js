// src/redux/slices/leadsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = "http://localhost:4000"; // Ensure this matches your backend URL

// Async Thunk to fetch leads for a specific employee
export const fetchEmployeeLeads = createAsyncThunk(
  "leads/fetchEmployeeLeads",
  async (
    {
      employeeId,
      search = "",
      status = "",
      filterBy = "",
      isScheduledOnly = false,
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/leads`, {
        params: {
          assignedTo: employeeId,
          search,
          status,
          filterBy,
          isScheduledOnly: isScheduledOnly ? "true" : "false",
        },
      });
      return response.data.leads;
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

// Async Thunk to update a lead (type, status, or schedule, or convert)
export const updateLead = createAsyncThunk(
  "leads/updateLead",
  async ({ leadId, updateData }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${BACKEND_URL}/api/leads/${leadId}`,
        updateData
      );
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

const leadsSlice = createSlice({
  name: "leads",
  initialState: {
    leads: [],
    isLoading: false,
    error: null,
    searchQuery: "",
    filterStatus: "", // 'Open', 'Closed', or '' for all (for LeadsPage)
    scheduleFilterType: "All", // 'Today' or 'All' (for SchedulePage)
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    setScheduleFilterType: (state, action) => {
      // This is the action creator that needs to be exported
      state.scheduleFilterType = action.payload;
    },
    clearLeadsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeLeads.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeLeads.fulfilled, (state, action) => {
        state.isLoading = false;
        state.leads = action.payload;
      })
      .addCase(fetchEmployeeLeads.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch leads.";
        state.leads = [];
      })
      .addCase(updateLead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedLead = action.payload;
        const index = state.leads.findIndex(
          (lead) => lead._id === updatedLead._id
        );
        if (index !== -1) {
          state.leads[index] = updatedLead;
        }
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to update lead.";
      });
  },
});

// IMPORTANT: Ensure setScheduleFilterType is included here
export const {
  setSearchQuery,
  setFilterStatus,
  setScheduleFilterType,
  clearLeadsError,
} = leadsSlice.actions;
export default leadsSlice.reducer;
