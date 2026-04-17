import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_OFFICIALS, SEARCH_OFFICIALS } from "../graphql";
import { getInitials } from "../utils";

function OfficialCard({ official, onClick }) {
  const initials = getInitials(official.name);

  return (
    <div className="official-card" onClick={() => onClick(official.id)}>
      <div className="card-header">
        <div className="avatar">{initials}</div>
        <div>
          <h3>{official.name}</h3>
          <div className="subtitle">
            {official.position} {official.department ? `| ${official.department}` : ""}
          </div>
        </div>
      </div>
      <div className="card-meta">
        <span className={`badge ${official.role.toLowerCase()}`}>
          {official.role}
        </span>
        {official.party && <span className="badge state">{official.party}</span>}
        <span className="badge state">
          {official.district ? `${official.district}, ` : ""}{official.state}
        </span>
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
    variables: { role: filter.role || undefined },
    skip: isSearching,
  });

  const searchQuery = useQuery(SEARCH_OFFICIALS, {
    variables: { query: debouncedSearch },
    skip: !isSearching,
  });

  const { loading, error, data } = isSearching ? searchQuery : officialsQuery;
  const officials = isSearching
    ? data?.searchOfficials
    : data?.officials;

  return (
    <div>
      <div className="filters-bar">
        <input
          className="search-box"
          type="text"
          placeholder="Search officials by name, party, position, state..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
        />
        <button
          className={`filter-btn ${!filter.role ? "active" : ""}`}
          onClick={() => setFilter({ ...filter, role: null })}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter.role === "POLITICIAN" ? "active" : ""}`}
          onClick={() => setFilter({ ...filter, role: "POLITICIAN" })}
        >
          Politicians
        </button>
        <button
          className={`filter-btn ${filter.role === "BUREAUCRAT" ? "active" : ""}`}
          onClick={() => setFilter({ ...filter, role: "BUREAUCRAT" })}
        >
          Bureaucrats
        </button>
      </div>

      {loading && <div className="loading">Loading officials...</div>}
      {error && <div className="error-msg">Error loading data. Is the server running?</div>}

      {officials && officials.length === 0 && (
        <div className="empty-state">No officials found.</div>
      )}

      <div className="officials-grid">
        {officials?.map((o) => (
          <OfficialCard key={o.id} official={o} onClick={onSelect} />
        ))}
      </div>
    </div>
  );
}
