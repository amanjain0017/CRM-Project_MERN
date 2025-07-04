import "./SidebarStyle.css";

const Sidebar = ({ setActivePage, activePage }) => {
  const handleNavigationClick = (pageName) => {
    setActivePage(pageName);
  };

  return (
    <aside className="sidebar-aside">
      <div className="sidebar-header">
        Canova<span className="crm">CRM</span>
      </div>

      <hr />

      <nav className="sidebar-nav">
        <div
          onClick={() => handleNavigationClick("Dashboard")}
          className={`sidebar-link ${
            activePage === "Dashboard" ? "active" : ""
          }`}
        >
          Dashboard
        </div>
        <div
          onClick={() => handleNavigationClick("Leads")}
          className={`sidebar-link ${activePage === "Leads" ? "active" : ""}`}
        >
          Leads
        </div>
        <div
          onClick={() => handleNavigationClick("Employees")}
          className={`sidebar-link ${
            activePage === "Employees" ? "active" : ""
          }`}
        >
          Employees
        </div>
        <div
          onClick={() => handleNavigationClick("Settings")}
          className={`sidebar-link ${
            activePage === "Settings" ? "active" : ""
          }`}
        >
          Settings
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
