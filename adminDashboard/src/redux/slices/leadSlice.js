import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = "http://localhost:4000";

// fetching all leads
export const fetchLeads = createAsyncThunk(
  "leads/fetchLeads",
  async (params, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        ...params,
        limit: 10000, // no pagination
        page: 1,
      }).toString();

      const response = await axios.get(
        `${BACKEND_URL}/api/leads?${queryParams}`
      );
      return response.data; // Expecting { leads: [], currentPage: ..., totalPages: ..., totalResults: ... }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message);
    }
  }
);

// uploading leads via CSV
export const uploadLeadsCSV = createAsyncThunk(
  "leads/uploadLeadsCSV",
  async (csvData, { rejectWithValue }) => {
    try {
      // string expected at backend in 'csvData' field of request body
      const response = await axios.post(`${BACKEND_URL}/api/leads/upload`, {
        csvData,
      });
      return response.data;
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message);
    }
  }
);

const leadSlice = createSlice({
  name: "leads",
  initialState: {
    list: [],
    isLoading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    uploadStatus: null, // 'idle', 'pending', 'success', 'failed'
    uploadMessage: null, // CSV upload message
    uploadErrors: [], // errors from CSV processing
  },
  reducers: {
    clearLeadsError: (state) => {
      state.error = null;
    },
    clearUploadStatus: (state) => {
      state.uploadStatus = "idle";
      state.uploadMessage = null;
      state.uploadErrors = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Leads
      .addCase(fetchLeads.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload.leads;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalResults = action.payload.totalResults;
        state.error = null;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch leads";
        state.list = []; // Clear list on error
      })
      // Upload Leads CSV
      .addCase(uploadLeadsCSV.pending, (state) => {
        state.uploadStatus = "pending";
        state.uploadMessage = null;
        state.uploadErrors = [];
        state.error = null;
      })
      .addCase(uploadLeadsCSV.fulfilled, (state, action) => {
        state.uploadStatus = "success";
        state.uploadMessage =
          action.payload.message || "CSV uploaded successfully!";
        state.uploadErrors = action.payload.errors || [];
      })
      .addCase(uploadLeadsCSV.rejected, (state, action) => {
        state.uploadStatus = "failed";
        state.uploadMessage = action.payload || "Failed to upload CSV.";
        state.uploadErrors = []; // Clear previous errors or set a generic error
        state.error = action.payload || "Failed to upload CSV."; // set general error
      });
  },
});

export const { clearLeadsError, clearUploadStatus } = leadSlice.actions;
export default leadSlice.reducer;
