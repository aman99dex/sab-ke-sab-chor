import { useState } from "react";

const LEVEL_TABS = [
  { label: "All Levels", value: null, icon: "🌐" },
  { label: "National", value: "NATIONAL", icon: "🏛️" },
  { label: "State", value: "STATE", icon: "🗺️" },
  { label: "District", value: "DISTRICT", icon: "🏙️" },
  { label: "Block", value: "BLOCK", icon: "🏘️" },
  { label: "Panchayat", value: "PANCHAYAT", icon: "🌾" },
];

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
];

const PARTIES = [
  "Bharatiya Janata Party", "Indian National Congress", "Aam Aadmi Party",
  "All India Trinamool Congress", "Samajwadi Party", "Bharat Rashtra Samithi",
  "Nationalist Congress Party (SP)", "Dravida Munnetra Kazhagam",
  "Janata Dal (United)", "Independent",
];

export default function Filters({ filter, setFilter }) {
  const [showState, setShowState] = useState(false);
  const [showParty, setShowParty] = useState(false);

  return (
    <div className="filters-section">
      {/* Search */}
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-box"
          type="text"
          placeholder="Search officials, party, constituency, state..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
        />
        {filter.search && (
          <button className="search-clear" onClick={() => setFilter({ ...filter, search: "" })}>✕</button>
        )}
      </div>

      {/* Level Tabs */}
      <div className="level-tabs">
        {LEVEL_TABS.map((t) => (
          <button
            key={t.label}
            className={`level-tab ${filter.level === t.value ? "active" : ""}`}
            onClick={() => setFilter({ ...filter, level: t.value })}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Secondary filters row */}
      <div className="filter-row">
        <div className="filter-dropdown-wrap">
          <button
            className={`filter-chip ${filter.role === "POLITICIAN" ? "active" : ""}`}
            onClick={() => setFilter({ ...filter, role: filter.role === "POLITICIAN" ? null : "POLITICIAN" })}
          >
            🧑‍💼 Politicians
          </button>
          <button
            className={`filter-chip ${filter.role === "BUREAUCRAT" ? "active" : ""}`}
            onClick={() => setFilter({ ...filter, role: filter.role === "BUREAUCRAT" ? null : "BUREAUCRAT" })}
          >
            🏢 Bureaucrats
          </button>

          {/* State dropdown */}
          <div className="dropdown-container">
            <button
              className={`filter-chip ${filter.state ? "active" : ""}`}
              onClick={() => setShowState(!showState)}
            >
              📍 {filter.state || "All States"} ▾
            </button>
            {showState && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => { setFilter({ ...filter, state: null }); setShowState(false); }}>
                  All States
                </div>
                {STATES.map((s) => (
                  <div key={s} className="dropdown-item" onClick={() => { setFilter({ ...filter, state: s }); setShowState(false); }}>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Party dropdown */}
          <div className="dropdown-container">
            <button
              className={`filter-chip ${filter.party ? "active" : ""}`}
              onClick={() => setShowParty(!showParty)}
            >
              🎗️ {filter.party ? filter.party.split(" ").slice(0, 2).join(" ") + "..." : "All Parties"} ▾
            </button>
            {showParty && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => { setFilter({ ...filter, party: null }); setShowParty(false); }}>
                  All Parties
                </div>
                {PARTIES.map((p) => (
                  <div key={p} className="dropdown-item" onClick={() => { setFilter({ ...filter, party: p }); setShowParty(false); }}>
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clear all */}
          {(filter.role || filter.state || filter.party || filter.level) && (
            <button
              className="filter-chip clear"
              onClick={() => setFilter({ ...filter, role: null, state: null, party: null, level: null })}
            >
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
