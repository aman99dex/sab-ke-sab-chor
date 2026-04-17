import { useState } from "react";
import Background3D from "./Background3D";
import Header from "./components/Header";
import OfficialsList from "./components/OfficialsList";
import OfficialDetail from "./components/OfficialDetail";
import SubmitClaim from "./components/SubmitClaim";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState({ role: null, search: "" });

  const viewOfficial = (id) => {
    setSelectedId(id);
    setPage("detail");
  };

  const goHome = () => {
    setPage("home");
    setSelectedId(null);
  };

  return (
    <>
      <Background3D />
      <div className="app-container">
        <Header
          page={page}
          onNavigate={(p) => {
            setPage(p);
            setSelectedId(null);
          }}
        />
        <main className="main-content">
          {page === "home" && (
            <OfficialsList
              filter={filter}
              setFilter={setFilter}
              onSelect={viewOfficial}
            />
          )}
          {page === "detail" && selectedId && (
            <OfficialDetail id={selectedId} onBack={goHome} />
          )}
          {page === "submit" && <SubmitClaim onDone={goHome} />}
        </main>
      </div>
    </>
  );
}

export default App;
