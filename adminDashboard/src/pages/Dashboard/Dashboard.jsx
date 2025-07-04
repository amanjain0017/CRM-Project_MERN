import KPICardsSection from "../../components/Dashboard/KPICardSection/KPICardSection";
import SalesChart from "../../components/Dashboard/SalesChart/SalesChart";
import RecentActivityFeed from "../../components/Dashboard/RecentActivityFeed/RecentActivityFeed";
import EmployeesTable from "../../components/Dashboard/EmployeesTable/EmployeesTable"; // Specific EmployeesTable for Dashboard

import "./DashboardStyle.css"; // Main dashboard layout CSS

const Dashboard = () => {
  return (
    <div className="dashboard-page-content">
      {/* Key Performance Indicators*/}
      <KPICardsSection />

      {/* arranged in a grid */}
      <div className="dashboard-section-grid">
        <SalesChart />

        <RecentActivityFeed />
      </div>

      {/* Employees Table Component  */}
      <EmployeesTable />
    </div>
  );
};

export default Dashboard;
