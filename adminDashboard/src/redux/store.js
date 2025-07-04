import { configureStore } from "@reduxjs/toolkit";

//importing slices
import adminProfileReducer from "./slices/adminProfileSlice";
import employeesReducer from "./slices/employeeSlice";
import leadReducer from "./slices/leadSlice";
import dashboardReducer from "./slices/dashboardSlice";

export const store = configureStore({
  reducer: {
    // Adding reducers from slices
    adminProfile: adminProfileReducer,
    employees: employeesReducer,
    leads: leadReducer,
    dashboard: dashboardReducer,
  },
});
