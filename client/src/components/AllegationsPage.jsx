import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_ALLEGATIONS } from "../graphql";

const SEVERITY_ORDER = ["HIGH", "MEDIUM", "LOW"];
const STATUS_OPTIONS = ["All", "INVESTIGATING", "UNVERIFIED", "VERIFIED", "DISMISSED"];
const SEVERITY_OPTIONS = ["All", "HIGH", "MEDIUM", "LOW"];

function SeverityBadge({ severity }) {
  const colors = { HIGH: "#ef4444", MEDIUM: "#f97316", LOW: "#eab308" };
  const color = colors[severity] || "var(--text-muted)";
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
      color, background: `${color}18`, border: `1px solid ${color}40`,
      padding: "3px 9px", borderRadius: 6,
    }}>{severity}</span>
  );
}

function StatusBadge({ status }) {
  const colors = {
    INVESTIGATING: "#6366f1", UNVERIFIED: "#f97316",
    VERIFIED: "#22c55e", DISMISSED: "#64748b",
  };
  const color = colors[status] || "var(--text-muted)";
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color,
      background: `${color}15`, border: `1px solid ${color}35`,
      padding: "3px 9px", borderRadius: 6,
    }}>{status}</span>
  );
}

function AllegationCard({ allegation, onSelectOfficial }) {
  const [expanded, setExpanded] = useState(false);
  const o = allegation.official;
  const date = allegation.createdAt
    ? new Date(allegation.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="page-card allegation-feed-card">
      <div className="page-card-top">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <SeverityBadge severity={allegation.severity} />
          <StatusBadge status={allegation.status} />
        </div>
        <span className="date-label">{date}</span>
      </div>

      <h3 className="page-card-title">{allegation.title}</h3>

      {allegation.description && (
        <p className="page-card-desc" style={{ WebkitLineClamp: expanded ? "unset" : 3 }}>
          {allegation.description}
        </p>
      )}
      {allegation.description && allegation.description.length > 180 && (
        <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show less ▲" : "Read more ▼"}
        </button>
      )}

      <div className="page-card-footer">
        <button className="official-chip" onClick={() => onSelectOfficial(o.id)}>
          <span className={`role-dot ${o.role?.toLowerCase()}`} />
          {o.name} · {o.state}
          {o.party && <span style={{ color: "var(--text-muted)", fontSize: 11 }}> · {o.party}</span>}
        </button>
        {allegation.sourceUrl && (
          <a href={allegation.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
            🔗 Source
          </a>
        )}
      </div>
    </div>
  );
}

export default function AllegationsPage({ onSelectOfficial }) {
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const { data, loading, error } = useQuery(GET_ALLEGATIONS, {
    variables: {
      severity: severityFilter === "All" ? undefined : severityFilter,
      status: statusFilter === "All" ? undefined : statusFilter,
    },
  });

  const allegations = data?.allegations || [];

  const filtered = allegations.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.official?.name?.toLowerCase().includes(q) ||
      a.official?.state?.toLowerCase().includes(q)
    );
  });

  const byHighest = [...filtered].sort((a, b) =>
    SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );

  const highCount = filtered.filter((a) => a.severity === "HIGH").length;
  const investigating = filtered.filter((a) => a.status === "INVESTIGATING").length;

  return (
    <div className="full-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">⚠️ Allegations Feed</h2>
          <p className="page-subtitle">All verified and unverified allegations against tracked officials</p>
        </div>
        <div className="page-header-stats">
          <div className="phs-item">
            <span className="phs-val" style={{ color: "#ef4444" }}>{highCount}</span>
            <span className="phs-label">High Severity</span>
          </div>
          <div className="phs-item">
            <span className="phs-val" style={{ color: "#6366f1" }}>{investigating}</span>
            <span className="phs-label">Investigating</span>
          </div>
          <div className="phs-item">
            <span className="phs-val">{filtered.length}</span>
            <span className="phs-label">Total</span>
          </div>
        </div>
      </div>

      <div className="page-filters">
        <div className="search-wrap" style={{ flex: 1, maxWidth: 380 }}>
          <span className="search-icon">🔍</span>
          <input
            className="search-box"
            type="text"
            placeholder="Search allegations, officials, states..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch("")}>✕</button>}
        </div>
        <div className="filter-chips-row">
          {SEVERITY_OPTIONS.map((s) => (
            <button
              key={s}
              className={`filter-chip ${severityFilter === s ? "active" : ""}`}
              onClick={() => setSeverityFilter(s)}
            >
              {s === "HIGH" ? "🔴" : s === "MEDIUM" ? "🟠" : s === "LOW" ? "🟡" : "🌐"} {s}
            </button>
          ))}
        </div>
        <div className="filter-chips-row">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={`filter-chip ${statusFilter === s ? "active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="loading"><div className="loading-spinner" /> Loading allegations...</div>}
      {error && <div className="error-msg">Failed to load allegations.</div>}

      {!loading && byHighest.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          No allegations match your filters.
        </div>
      )}

      <div className="page-cards-list">
        {byHighest.map((a) => (
          <AllegationCard key={a.id} allegation={a} onSelectOfficial={onSelectOfficial} />
        ))}
      </div>
    </div>
  );
}
