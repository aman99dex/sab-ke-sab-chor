import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Background3D from "./Background3D";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import OfficialsList from "./components/OfficialsList";
import OfficialDetail from "./components/OfficialDetail";
import SubmitClaim from "./components/SubmitClaim";
import DashboardPage from "./components/DashboardPage";
import GlobalPeopleSearch from "./components/GlobalPeopleSearch";
import AgentTaskPanel from "./components/AgentTaskPanel";
import IndiaIntro3D from "./components/IndiaIntro3D";
import AllegationsPage from "./components/AllegationsPage";
import CourtCasesPage from "./components/CourtCasesPage";
import NewsPage from "./components/NewsPage";
import LeaderboardPage from "./components/LeaderboardPage";
import AboutPage from "./components/AboutPage";
import "./App.css";

function AppInner() {
  const navigate = useNavigate();

  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem("neta:introSeen") !== "1";
    } catch {
      return true;
    }
  });
  const [isIntroLeaving, setIsIntroLeaving] = useState(false);
  const [filter, setFilter] = useState({
    role: null, search: "", level: null, state: null, party: null,
  });

  const enterApp = (selectedState = null) => {
    if (isIntroLeaving) return;
    setIsIntroLeaving(true);
    if (selectedState) {
      setFilter((f) => ({ ...f, state: selectedState }));
      navigate("/officials");
    } else {
      navigate("/dashboard");
    }
    setTimeout(() => {
      setShowIntro(false);
      setIsIntroLeaving(false);
    }, 1300);
    try { sessionStorage.setItem("neta:introSeen", "1"); } catch {}
  };

  const viewOfficial = (id) => {
    navigate(`/official/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Background3D mode={showIntro ? "intro" : "app"} />

      {showIntro && (
        <div className={`intro-layer ${isIntroLeaving ? "leaving" : ""}`}>
          <IndiaIntro3D onEnter={enterApp} isExiting={isIntroLeaving} />
        </div>
      )}

      <div className={`app-container ${showIntro ? "app-hidden" : "app-visible"}`}>
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <>
                <HeroSection onExplore={(p) => p === "submit" ? navigate("/submit") : document.getElementById("officials-grid")?.scrollIntoView({ behavior: "smooth" })} />
                <GlobalPeopleSearch />
                <AgentTaskPanel />
                <div id="officials-grid">
                  <OfficialsList filter={filter} setFilter={setFilter} onSelect={viewOfficial} />
                </div>
              </>
            } />
            <Route path="/officials" element={
              <div id="officials-grid">
                <OfficialsList filter={filter} setFilter={setFilter} onSelect={viewOfficial} />
              </div>
            } />
            <Route path="/official/:id" element={<OfficialDetail onBack={() => navigate(-1)} />} />
            <Route path="/dashboard" element={<DashboardPage onSelectOfficial={viewOfficial} />} />
            <Route path="/allegations" element={<AllegationsPage onSelectOfficial={viewOfficial} />} />
            <Route path="/court-cases" element={<CourtCasesPage onSelectOfficial={viewOfficial} />} />
            <Route path="/news" element={<NewsPage onSelectOfficial={viewOfficial} />} />
            <Route path="/leaderboard" element={<LeaderboardPage onSelectOfficial={viewOfficial} />} />
            <Route path="/submit" element={<SubmitClaim onDone={() => navigate("/officials")} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={
              <div className="empty-state" style={{ marginTop: 80, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <h2>Page not found</h2>
                <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/")}>
                  Go Home
                </button>
              </div>
            } />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="footer-inner">
            <div>
              <span className="gradient-text" style={{ fontWeight: 700 }}>नेता Watch</span>
              {" "}— Open source political accountability platform
            </div>
            <div className="footer-links">
              <span>Built for transparency 🇮🇳</span>
              <span>·</span>
              <span>AI: Groq Llama 3 + HuggingFace</span>
              <span>·</span>
              <span>Data: ECI + public records</span>
              <span>·</span>
              <button className="footer-link-btn" onClick={() => navigate("/about")}>About</button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default function App() {
  return <AppInner />;
}
