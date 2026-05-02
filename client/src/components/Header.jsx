import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { GET_STATS_SUMMARY } from "../graphql";

export default function Header({ currentPath }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { data } = useQuery(GET_STATS_SUMMARY);
  const stats = data?.statsSummary;

  const navItems = [
    { path: "/officials", label: "Officials", icon: "👤" },
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/allegations", label: "Allegations", icon: "⚠️" },
    { path: "/court-cases", label: "Court Cases", icon: "🏛️" },
    { path: "/news", label: "News", icon: "📰" },
    { path: "/leaderboard", label: "Leaderboard", icon: "🏆" },
    { path: "/submit", label: "Submit Claim", icon: "✏️", accent: true },
  ];

  const isActive = (path) => {
    if (!currentPath) return false;
    if (path === "/officials" && (currentPath === "/" || currentPath === "/officials")) return true;
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const go = (path) => {
    navigate(path);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo" onClick={() => go("/")}>
          <div className="logo-icon"><span>🇮🇳</span></div>
          <div>
            <div className="logo-text">Neta Watch</div>
            <div className="logo-sub">Political Accountability Platform</div>
          </div>
        </div>

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
              <span className="hstat-val">{stats.totalCourtCases}</span>
              <span className="hstat-label">Court Cases</span>
            </div>
            <div className="hstat-divider" />
            <div className="hstat">
              <span className="hstat-val">{stats.statesTracked}</span>
              <span className="hstat-label">States</span>
            </div>
          </div>
        )}

        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-btn ${isActive(item.path) ? "active" : ""} ${item.accent ? "accent" : ""}`}
              onClick={() => go(item.path)}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`mobile-nav-btn ${isActive(item.path) ? "active" : ""}`}
              onClick={() => go(item.path)}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
