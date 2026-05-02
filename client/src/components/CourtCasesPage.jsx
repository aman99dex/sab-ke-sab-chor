import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_COURT_CASES } from "../graphql";

const STATUS_OPTIONS = ["All", "HEARING", "CONVICTED", "ACQUITTED", "PENDING", "DISMISSED"];

function CaseStatusBadge({ status }) {
  const map = {
    CONVICTED: "#ef4444",
    HEARING: "#6366f1",
    ACQUITTED: "#22c55e",
    PENDING: "#f97316",
    DISMISSED: "#64748b",
  };
  const color = map[status] || "var(--text-muted)";
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
      color, background: `${color}18`, border: `1px solid ${color}40`,
      padding: "3px 10px", borderRadius: 6,
    }}>{status}</span>
  );
}

function CourtCaseCard({ cc, onSelectOfficial }) {
  const o = cc.official;
  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <div className="page-card court-case-card">
      <div className="page-card-top">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <CaseStatusBadge status={cc.status} />
          <span className="claim-type-badge">{cc.caseType}</span>
        </div>
        <span className="court-label">🏛️ {cc.court}</span>
      </div>

      <h3 className="page-card-title" style={{ fontFamily: "monospace", fontSize: 15 }}>
        {cc.caseNumber}
      </h3>

      {cc.charges && cc.charges.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0" }}>
          {cc.charges.map((ch, i) => (
            <span key={i} className="claim-type-badge sm">{ch}</span>
          ))}
        </div>
      )}

      {cc.judgmentSummary && (
        <p className="page-card-desc">{cc.judgmentSummary}</p>
      )}

      <div className="court-dates-row">
        {fmt(cc.filingDate) && (
          <span className="date-label">Filed: {fmt(cc.filingDate)}</span>
        )}
        {fmt(cc.lastHearingDate) && (
          <span className="date-label">Last heard: {fmt(cc.lastHearingDate)}</span>
        )}
        {fmt(cc.nextHearingDate) && (
          <span className="date-label" style={{ color: "var(--orange)" }}>
            ⏰ Next: {fmt(cc.nextHearingDate)}
          </span>
        )}
      </div>

      <div className="page-card-footer">
        <button className="official-chip" onClick={() => onSelectOfficial(o.id)}>
          <span className="role-dot politician" />
          {o.name} · {o.state}
          {o.party && <span style={{ color: "var(--text-muted)", fontSize: 11 }}> · {o.party}</span>}
        </button>
        {cc.sourceUrl && (
          <a href={cc.sourceUrl} target="_blank" rel="noreferrer" className="source-link">🔗 Source</a>
        )}
      </div>
    </div>
  );
}

export default function CourtCasesPage({ onSelectOfficial }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const { data, loading, error } = useQuery(GET_COURT_CASES, {
    variables: { status: statusFilter === "All" ? undefined : statusFilter },
  });

  const cases = data?.courtCases || [];

  const filtered = cases.filter((cc) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      cc.caseNumber?.toLowerCase().includes(q) ||
      cc.court?.toLowerCase().includes(q) ||
      cc.caseType?.toLowerCase().includes(q) ||
      cc.official?.name?.toLowerCase().includes(q) ||
      cc.charges?.some((c) => c.toLowerCase().includes(q))
    );
  });

  const convicted = filtered.filter((c) => c.status === "CONVICTED").length;
  const hearing = filtered.filter((c) => c.status === "HEARING").length;

  return (
    <div className="full-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">🏛️ Court Cases Tracker</h2>
          <p className="page-subtitle">Criminal and civil court cases involving tracked officials</p>
        </div>
        <div className="page-header-stats">
          <div className="phs-item">
            <span className="phs-val" style={{ color: "#ef4444" }}>{convicted}</span>
            <span className="phs-label">Convicted</span>
          </div>
          <div className="phs-item">
            <span className="phs-val" style={{ color: "#6366f1" }}>{hearing}</span>
            <span className="phs-label">In Hearing</span>
          </div>
          <div className="phs-item">
            <span className="phs-val">{filtered.length}</span>
            <span className="phs-label">Total Cases</span>
          </div>
        </div>
      </div>

      <div className="page-filters">
        <div className="search-wrap" style={{ flex: 1, maxWidth: 380 }}>
          <span className="search-icon">🔍</span>
          <input
            className="search-box"
            type="text"
            placeholder="Search case number, court, official, charges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch("")}>✕</button>}
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

      {loading && <div className="loading"><div className="loading-spinner" />Loading court cases...</div>}
      {error && <div className="error-msg">Failed to load court cases.</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
          No court cases match your filters.
        </div>
      )}

      <div className="page-cards-list">
        {filtered.map((cc) => (
          <CourtCaseCard key={cc.id} cc={cc} onSelectOfficial={onSelectOfficial} />
        ))}
      </div>
    </div>
  );
}
