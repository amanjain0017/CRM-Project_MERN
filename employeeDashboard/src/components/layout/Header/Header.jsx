import "./HeaderStyle.css";

const Header = ({ pageTitle, employeeProfile }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good Morning";
    } else if (hour < 18) {
      return "Good Afternoon";
    } else {
      return "Good Evening";
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <h2 className="header-crm-title">
          Canova<span>CRM</span>
        </h2>
        {pageTitle === "Home" && employeeProfile?.firstName ? (
          // Display dynamic greeting and employee name for Home page
          <>
            <p className="header-page-title">
              {getGreeting()}, {employeeProfile.firstName}
            </p>
          </>
        ) : (
          // Otherwise, display just the page title
          <h2 className="header-page-title">&lt; {pageTitle}</h2>
        )}
      </div>
    </header>
  );
};

export default Header;
