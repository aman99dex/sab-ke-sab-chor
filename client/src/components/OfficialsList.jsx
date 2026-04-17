import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_OFFICIALS, SEARCH_OFFICIALS } from "../graphql";
import { getInitials } from "../utils";
import LevelBadge from "./LevelBadge";
import FiltersBar from "./FiltersBar";

function formatAssets(amount) {
  if (!amount) return null;
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function OfficialCard({ official, onClick }) {
  const initials = getInitials(official.name);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`official-card ${hovered ? "hovered" : ""}`}
      onClick={() => onClick(official.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent line */}
      <div className="card-accent-line" />

      <div className="card-header">
        <div className="avatar">
          {official.profilePhoto ? (
            <img src={official.profilePhoto} alt={official.name} />
          ) : (
            initials
          )}
        </div>
        <div className="card-title-wrap">
          <h3>{official.name}</h3>
          <div className="subtitle">{official.position}</div>
          {official.constituency && (
            <div className="constituency">{official.constituency}</div>
          )}
        </div>
      </div>

      <div className="card-meta">
        <LevelBadge level={official.level} />
        <span className={`badge ${official.role.toLowerCase()}`}>{official.role}</span>
        {official.party && (
          <span className="badge party" title={official.party}>
            {official.party.length > 22 ? official.party.substring(0, 20) + "…" : official.party}
          </span>
        )}
      </div>

      <div className="card-location">
        <span>📍 {official.district ? `${official.district}, ` : ""}{official.state}</span>
      </div>

      <div className="card-stats">
        {official.criminalCases != null && official.criminalCases > 0 && (
          <span className="stat-pill danger">
            ⚠️ {official.criminalCases} Criminal Case{official.criminalCases !== 1 ? "s" : ""}
          </span>
        )}
        {official.assets != null && (
          <span className="stat-pill neutral">
            💰 {formatAssets(official.assets)}
          </span>
        )}
        {official.criminalCases === 0 && (
          <span className="stat-pill success">✓ Clean Record</span>
        )}
      </div>
    </div>
  );
}

export default function OfficialsList({ filter, setFilter, onSelect }) {
  const [debouncedSearch, setDebouncedSearch] = useState(filter.search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filter.search), 300);
    return () => clearTimeout(timer);
  }, [filter.search]);

  const isSearching = debouncedSearch.length >= 2;

  const officialsQuery = useQuery(GET_OFFICIALS, {
    variables: {
      role: filter.role || undefined,
      state: filter.state || undefined,
      level: filter.level || undefined,
      party: filter.party || undefined,
    },
    skip: isSearching,
  });

  const searchQuery = useQuery(SEARCH_OFFICIALS, {
    variables: { query: debouncedSearch },
    skip: !isSearching,
  });

  const { loading, error, data } = isSearching ? searchQuery : officialsQuery;
  const officials = isSearching ? data?.searchOfficials : data?.officials;

  return (
    <div>
      <FiltersBar filter={filter} setFilter={setFilter} />

      {/* Result count */}
      {officials && !loading && (
        <div className="result-count">
          {officials.length === 0
            ? "No officials match your filters."
            : `${officials.length} official${officials.length !== 1 ? "s" : ""} found`}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="loading-spinner" />
          Loading officials...
        </div>
      )}
      {error && (
        <div className="error-msg">
          ⚠️ Error loading data. Is the backend running? (<code>node index.js</code>)
        </div>
      )}

      {officials && officials.length === 0 && !loading && (
        <div className="empty-state">
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          No officials found.
          <br />
          <span style={{ fontSize: 13 }}>Try adjusting your filters.</span>
        </div>
      )}

      <div className="officials-grid">
        {officials?.map((o) => (
          <OfficialCard key={o.id} official={o} onClick={onSelect} />
        ))}
      </div>
    </div>
  );
}
