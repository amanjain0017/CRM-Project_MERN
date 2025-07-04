import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import "./App.css";

import Sidebar from "./components/Layout/Sidebar/Sidebar";
import Header from "./components/Layout/Header/Header";

import Dashboard from "./pages/Dashboard/Dashboard";
import Leads from "./pages/Leads/Leads";
import Employees from "./pages/Employees/Employees";
import Settings from "./pages/Settings/Settings";

//importing thunk from adminProfileSlice
import { fetchAdminProfile } from "./redux/slices/adminProfileSlice";

function App() {
  // page tracking
  const [activePage, setActivePage] = useState("Dashboard");

  // Redux hooks
  const dispatch = useDispatch();
  const { adminUser } = useSelector((state) => state.adminProfile);

  // fetchAdminProfile on intial component mount
  useEffect(() => {
    dispatch(fetchAdminProfile());
  }, [dispatch]);

  //render active page
  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;
      case "Leads":
        return <Leads />;
      case "Employees":
        return <Employees />;
      case "Settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <div className="content-area">
        <main className="main-content-area">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
