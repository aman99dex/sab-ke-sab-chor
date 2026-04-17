import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_STATS_SUMMARY } from "../graphql";

export default function Header({ page, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data } = useQuery(GET_STATS_SUMMARY);
  const stats = data?.statsSummary;

  const navItems = [
    { id: "home", label: "Officials", icon: "👤" },
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "submit", label: "Submit Claim", icon: "✏️", accent: true },
  ];

  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <div className="logo" onClick={() => onNavigate("home")}>
          <div className="logo-icon">
            <span>🇮🇳</span>
          </div>
          <div>
            <div className="logo-text">Neta Watch</div>
            <div className="logo-sub">Political Accountability Platform</div>
          </div>
        </div>

        {/* Center quick stats */}
        {stats && (
          <div className="header-stats">
            <div className="hstat">
              <span className="hstat-val">{stats.totalOfficials}</span>
              <span className="hstat-label">Officials</span>
            </div>
            <div className="hstat-divider" />
            <div className="hstat">
              <span className="hstat-val">{stats.totalAllegations}</span>
              <span className="hstat-label">Allegations</span>
            </div>
            <div className="hstat-divider" />
            <div className="hstat">
              <span className="hstat-val">{stats.statesTracked}</span>
              <span className="hstat-label">States</span>
            </div>
          </div>
        )}

        {/* Desktop Nav */}
        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${page === item.id ? "active" : ""} ${item.accent ? "accent" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`mobile-nav-btn ${page === item.id ? "active" : ""}`}
              onClick={() => { onNavigate(item.id); setMenuOpen(false); }}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
