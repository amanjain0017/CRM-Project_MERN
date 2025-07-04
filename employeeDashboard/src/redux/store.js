import { configureStore } from "@reduxjs/toolkit";
import employeeDashboardReducer from "./slices/employeeDashboardSlice";
import authReducer from "./slices/authSlice";
import leadReducer from "./slices/leadSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employeeDashboard: employeeDashboardReducer,
    leads: leadReducer,
  },
});
