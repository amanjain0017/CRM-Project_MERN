import "./BottomNavBarStyle.css";

const BottomNavBar = ({ activePage, setActivePage }) => {
  const navItems = [
    { name: "Home", icon: "fas fa-home" },
    { name: "Leads", icon: "fas fa-users" },
    { name: "Schedule", icon: "fas fa-calendar-alt" },
    { name: "Profile", icon: "fas fa-user-circle" },
  ];

  return (
    <nav className="bottom-navigation">
      {navItems.map((item) => (
        <div
          key={item.name}
          className={`nav-item ${activePage === item.name ? "active" : ""}`}
          onClick={() => setActivePage(item.name)}
        >
          <i className={item.icon}></i>
          <span>{item.name}</span>
        </div>
      ))}
    </nav>
  );
};

export default BottomNavBar;
