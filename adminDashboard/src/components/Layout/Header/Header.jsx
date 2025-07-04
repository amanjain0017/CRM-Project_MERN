import "./HeaderStyle.css";
import searchIcon from "../../../assets/search.png";

const Header = ({ activePage, searchQuery, onSearchChange }) => {
  //only show the searchbar for leads and employee pages
  const showSearchBar = activePage === "Leads" || activePage === "Employees";

  return (
    <header className="main-header">
      <div className="flex-items-center">
        {showSearchBar && (
          <div className="search-bar-container">
            <div className="search-input-wrapper">
              <img src={searchIcon} alt="search-icon" className="search-icon" />
              <input
                type="text"
                placeholder="Search Here..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
      <hr />
    </header>
  );
};

export default Header;
