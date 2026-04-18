import { useState } from "react";
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
import "./App.css";

function App() {
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem("neta:introSeen") !== "1";
    } catch {
      return true;
    }
  });
  const [isIntroLeaving, setIsIntroLeaving] = useState(false);
  const [page, setPage] = useState("home");
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState({
    role: null,
    search: "",
    level: null,
    state: null,
    party: null,
  });

  const viewOfficial = (id) => {
    setSelectedId(id);
    setPage("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goHome = () => {
    setPage("home");
    setSelectedId(null);
  };

  const navigate = (p) => {
    setPage(p);
    setSelectedId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const enterApp = () => {
    if (isIntroLeaving) return;
    setIsIntroLeaving(true);
    setPage("dashboard");
    setTimeout(() => {
      setShowIntro(false);
      setIsIntroLeaving(false);
    }, 1300);

    try {
      sessionStorage.setItem("neta:introSeen", "1");
    } catch {
      // Ignore storage errors in private browsing.
    }
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
        <Header page={page} onNavigate={navigate} />
        <main className="main-content">
          {page === "home" && (
            <>
              <HeroSection onExplore={(p) => (p === "submit" ? navigate("submit") : document.getElementById("officials-grid")?.scrollIntoView({ behavior: "smooth" }))} />
              <GlobalPeopleSearch />
              <AgentTaskPanel />
              <div id="officials-grid">
                <OfficialsList
                  filter={filter}
                  setFilter={setFilter}
                  onSelect={viewOfficial}
                />
              </div>
            </>
          )}
          {page === "detail" && selectedId && (
            <OfficialDetail id={selectedId} onBack={goHome} />
          )}
          {page === "submit" && <SubmitClaim onDone={goHome} />}
          {page === "dashboard" && <DashboardPage onSelectOfficial={viewOfficial} />}
        </main>

        <footer className="app-footer">
          <div className="footer-inner">
            <div>
              <span className="gradient-text" style={{ fontWeight: 700 }}>Neta Watch</span>
              {" "}— Open source political accountability platform
            </div>
            <div className="footer-links">
              <span>Built for transparency 🇮🇳</span>
              <span>·</span>
              <span>AI by HuggingFace (open source)</span>
              <span>·</span>
              <span>Data: ECI + public records</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
