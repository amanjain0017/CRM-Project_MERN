import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// fetch all employees with filters and pagination
export const fetchEmployees = createAsyncThunk(
  "employees/fetchEmployees",
  async (params = {}, { rejectWithValue }) => {
    // 'params' will contain { search, isActive, language, location, page, limit }
    try {
      const response = await axios.get(`${BACKEND_URL}/api/employees`, {
        params: params, // query parameters for filtering, search, and pagination
      });
      return response.data; // Expected response: { employees: [], currentPage, totalPages, totalResults }
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

// create a new employee
export const createEmployee = createAsyncThunk(
  "employees/createEmployee",
  async (employeeData, { rejectWithValue }) => {
    try {
      // Corrected route to /api/employees
      const response = await axios.post(
        `${BACKEND_URL}/api/employees`,
        employeeData
      );
      return response.data; // The newly created employee object
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

// update an existing employee
export const updateEmployee = createAsyncThunk(
  "employees/updateEmployee",
  async ({ id, employeeData }, { rejectWithValue }) => {
    try {
      // Corrected route to /api/employees/:id
      const response = await axios.patch(
        `${BACKEND_URL}/api/employees/${id}`,
        employeeData
      );
      return response.data; // The updated employee object
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

// delete an employee
export const deleteEmployee = createAsyncThunk(
  "employees/deleteEmployee",
  async (employeeId, { rejectWithValue }) => {
    try {
      // Corrected route to /api/employees/:id
      await axios.delete(`${BACKEND_URL}/api/employees/${employeeId}`);
      return employeeId; // Return the ID of the deleted employee for state update
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

const employeesSlice = createSlice({
  name: "employees",
  initialState: {
    list: [], // employee objects
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    isLoading: false,
    error: null,
  },
  reducers: {
    // to clear employee-related errors
    clearEmployeesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Employees
      .addCase(fetchEmployees.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload.employees;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalResults = action.payload.totalResults;
        state.error = null;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.list = []; // Clear list on error
        state.error = action.payload || "Failed to fetch employees";
      })
      // Create Employee
      .addCase(createEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list.unshift(action.payload);
        state.totalResults += 1; // Increment total count
        state.error = null;
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to create employee";
      })
      // Update Employee
      .addCase(updateEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        // Find and update the employee in the list
        const index = state.list.findIndex(
          (emp) => emp._id === action.payload._id
        );
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to update employee";
      })
      // Delete Employee
      .addCase(deleteEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove deleted employee from list
        state.list = state.list.filter((emp) => emp._id !== action.payload);
        state.totalResults -= 1; // Decrement total count
        state.error = null;
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to delete employee";
      });
  },
});

export const { clearEmployeesError } = employeesSlice.actions;
export default employeesSlice.reducer;
