export default function Header({ page, onNavigate }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo" onClick={() => onNavigate("home")}>
          <div className="logo-icon">NW</div>
          Neta Watch
        </div>
        <nav className="nav">
          <button
            className={`nav-btn ${page === "home" ? "active" : ""}`}
            onClick={() => onNavigate("home")}
          >
            Officials
          </button>
          <button
            className="nav-btn accent"
            onClick={() => onNavigate("submit")}
          >
            Submit Claim
          </button>
        </nav>
      </div>
    </header>
  );
}
