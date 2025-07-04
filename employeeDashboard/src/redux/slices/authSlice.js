import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = "http://localhost:4000";

// Get user from localStorage (if logged-in)
const employee = JSON.parse(localStorage.getItem("employeeInfo"));

// employee login
export const loginEmployee = createAsyncThunk(
  "auth/loginEmployee",
  async (employeeCredentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/employee/auth/login`,
        employeeCredentials
      );

      //response structure is { message: "Login successful!", user: {...} }
      const userData = response.data.user;

      if (userData.role !== "employee") {
        return rejectWithValue(
          "Access Denied: Only employees can log in here."
        );
      }

      // Store user data in localStorage
      localStorage.setItem("employeeInfo", JSON.stringify(userData));
      return userData;
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

// fetching employee profile (after login)
export const fetchEmployeeProfile = createAsyncThunk(
  "auth/fetchEmployeeProfile",
  async (employeeId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/employees/${employeeId}`
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

// updating employee profile
export const updateEmployeeProfile = createAsyncThunk(
  "auth/updateEmployeeProfile",
  async ({ employeeId, profileData }, { rejectWithValue }) => {
    try {
      // Assuming /api/users/profile is for updating the logged-in user's profile

      const response = await axios.patch(
        `${BACKEND_URL}/api/employees/${employeeId}`,
        profileData
      );

      // Update localStorage with new info
      const currentEmployeeInfo = JSON.parse(
        localStorage.getItem("employeeInfo")
      );
      const updatedEmployeeInfo = { ...currentEmployeeInfo, ...response.data };
      localStorage.setItem("employeeInfo", JSON.stringify(updatedEmployeeInfo));

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

const authSlice = createSlice({
  name: "auth",
  initialState: {
    employeeInfo: employee ? employee : null, // Stores logged-in employee's data
    isLoading: false,
    error: null,
    isAuthenticated: employee ? true : false, // presence of employeeInfo
  },
  reducers: {
    logoutEmployee: (state) => {
      localStorage.removeItem("employeeInfo"); // Clear from localStorage
      state.employeeInfo = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login Employee
      .addCase(loginEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employeeInfo = action.payload; // Payload is the user object
        state.isAuthenticated = true;
      })
      .addCase(loginEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.employeeInfo = null;
        state.isAuthenticated = false;
      })
      // Fetch Employee Profile
      .addCase(fetchEmployeeProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update profile data within employeeInfo, keep token
        state.employeeInfo = { ...state.employeeInfo, ...action.payload };
        // Re-save to localStorage to persist updated profile
        localStorage.setItem(
          "employeeInfo",
          JSON.stringify(state.employeeInfo)
        );
      })
      .addCase(fetchEmployeeProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;

        if (
          action.payload &&
          (action.payload.includes("Not authorized") ||
            action.payload.includes("Access Denied"))
        ) {
          localStorage.removeItem("employeeInfo");
          state.employeeInfo = null;
          state.isAuthenticated = false;
        }
      })
      // Update Employee Profile
      .addCase(updateEmployeeProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEmployeeProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employeeInfo = { ...state.employeeInfo, ...action.payload };
      })
      .addCase(updateEmployeeProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logoutEmployee, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
