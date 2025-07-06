import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import EmployeeDashboard from "./pages/EmployeeDasboard/EmployeeDasboard";
import LoginPage from "./pages/Login/Login";
import ProfilePage from "./pages/Profile/Profile";
import LeadPage from "./pages/Leads/Leads";
import SchedulePage from "./pages/Schedule/Schedule";

import Header from "./components/layout/Header/Header";
import BottomNavBar from "./components/layout/BottomNavBar/BottomNavBar";

import "./App.css";

function App() {
  const { isAuthenticated, employeeInfo } = useSelector((state) => state.auth);
  const [activePage, setActivePage] = useState(
    isAuthenticated ? "Home" : "Login"
  );

  // Determine employeeId from Redux state
  const employeeId = employeeInfo?.id;

  // Effect to manage initial page load or authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      setActivePage("Home");
    } else {
      setActivePage("Login");
    }
  }, [isAuthenticated]);

  // Function to render the current page content
  const renderPageContent = () => {
    switch (activePage) {
      case "Home":
        return (
          <EmployeeDashboard
            employeeId={employeeId}
            employeeProfile={employeeInfo}
          />
        );
      case "Profile":
        return (
          <ProfilePage employeeId={employeeId} employeeProfile={employeeInfo} />
        );
      case "Leads":
        return <LeadPage employeeId={employeeId} />;
      case "Schedule":
        return <SchedulePage employeeId={employeeId} />;

      default:
        return <EmployeeDashboard employeeId={employeeId} />; // Fallback
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="employee-app-wrapper">
        <LoginPage />
      </div>
    );
  }

  // If authenticated, render the main layout with Header, content, and BottomNavBar
  return (
    <div className="employee-app-wrapper authenticated-layout">
      <Header pageTitle={activePage} employeeProfile={employeeInfo} />{" "}
      {/* Pass activePage as title */}
      <main className="app-main-content">{renderPageContent()}</main>
      <BottomNavBar activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}

export default App;
