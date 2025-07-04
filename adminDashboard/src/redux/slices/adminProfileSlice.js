import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// Async Thunk to fetch the single Admin user's profile
export const fetchAdminProfile = createAsyncThunk(
  "adminProfile/fetchAdminProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/admin/dashboard/profile`
      );
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

const adminProfileSlice = createSlice({
  name: "adminProfile",
  initialState: {
    adminUser: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    // to clear error messages (helpful in UI)
    clearAdminProfileError: (state) => {
      state.error = null;
    },
    // to manually set admin user if needed (from initial load)
    setAdminUser: (state, action) => {
      state.adminUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchAdminProfile lifecycle
      .addCase(fetchAdminProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminUser = action.payload; // Store the fetched admin user
        state.error = null;
      })
      .addCase(fetchAdminProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.adminUser = null; // Clear admin user on error
        state.error = action.payload || "Failed to fetch admin profile";
      });
  },
});

export const { clearAdminProfileError, setAdminUser } =
  adminProfileSlice.actions;
export default adminProfileSlice.reducer;
