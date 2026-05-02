import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_OFFICIALS_FOR_LEADERBOARD } from "../graphql";
import { getInitials } from "../utils";
import LevelBadge from "./LevelBadge";

const METRICS = [
  { id: "criminalCases", label: "Criminal Cases", icon: "⚠️", desc: "Most criminal cases pending", higherIsBad: true },
  { id: "assets", label: "Declared Assets", icon: "💰", desc: "Highest declared net worth", higherIsBad: false },
  { id: "promises_fulfilled", label: "Promises Fulfilled", icon: "✅", desc: "Most election promises kept", higherIsBad: false },
  { id: "allegations", label: "Allegations Filed", icon: "📋", desc: "Most allegations on record", higherIsBad: true },
];

function formatAssets(amount) {
  if (!amount) return "Not declared";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function getRankValue(official, metric) {
  switch (metric) {
    case "criminalCases": return official.criminalCases ?? 0;
    case "assets": return official.assets ?? 0;
    case "promises_fulfilled":
      return (official.promises || []).filter((p) => p.status === "COMPLETED").length;
    case "allegations":
      return (official.allegations || []).length;
    default: return 0;
  }
}

function getRankDisplay(official, metric) {
  switch (metric) {
    case "criminalCases": return `${official.criminalCases ?? 0} case${official.criminalCases !== 1 ? "s" : ""}`;
    case "assets": return formatAssets(official.assets);
    case "promises_fulfilled": {
      const total = (official.promises || []).length;
      const done = (official.promises || []).filter((p) => p.status === "COMPLETED").length;
      return `${done} / ${total} promises`;
    }
    case "allegations": {
      const al = (official.allegations || []);
      const high = al.filter((a) => a.severity === "HIGH").length;
      return `${al.length} total (${high} high)`;
    }
    default: return "—";
  }
}

function RankCard({ rank, official, metric, onSelect }) {
  const initials = getInitials(official.name);
  const displayVal = getRankDisplay(official, metric);
  const rankColor = rank === 1 ? "#fbbf24" : rank === 2 ? "#94a3b8" : rank === 3 ? "#fb923c" : "var(--text-muted)";
  const metricObj = METRICS.find((m) => m.id === metric);
  const isBad = metricObj?.higherIsBad && rank <= 3 && getRankValue(official, metric) > 0;

  return (
    <div
      className={`leaderboard-card ${rank <= 3 ? "top-three" : ""}`}
      onClick={() => onSelect(official.id)}
      style={{ cursor: "pointer" }}
    >
      <div className="lb-rank" style={{ color: rankColor }}>
        {rank <= 3 ? (rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉") : `#${rank}`}
      </div>
      <div className="lb-avatar" style={{ background: isBad ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)" }}>
        {initials}
      </div>
      <div className="lb-info">
        <div className="lb-name">{official.name}</div>
        <div className="lb-sub">{official.position || official.role} · {official.state}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          <LevelBadge level={official.level} size="sm" />
          {official.party && (
            <span className="badge party" style={{ fontSize: 10 }}>
              {official.party.length > 20 ? official.party.slice(0, 18) + "…" : official.party}
            </span>
          )}
        </div>
      </div>
      <div className="lb-value" style={{ color: isBad ? "#ef4444" : "var(--accent-bright)" }}>
        {displayVal}
      </div>
    </div>
  );
}

export default function LeaderboardPage({ onSelectOfficial }) {
  const [activeMetric, setActiveMetric] = useState("criminalCases");
  const [roleFilter, setRoleFilter] = useState("All");

  const { data, loading, error } = useQuery(GET_OFFICIALS_FOR_LEADERBOARD);
  const officials = data?.officials || [];

  const filtered = officials.filter((o) =>
    roleFilter === "All" || o.role === roleFilter
  );

  const ranked = [...filtered].sort((a, b) =>
    getRankValue(b, activeMetric) - getRankValue(a, activeMetric)
  ).slice(0, 20);

  const metric = METRICS.find((m) => m.id === activeMetric);

  return (
    <div className="full-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">🏆 Accountability Leaderboard</h2>
          <p className="page-subtitle">Officials ranked by key accountability metrics</p>
        </div>
      </div>

      <div className="page-filters">
        <div className="filter-chips-row">
          {METRICS.map((m) => (
            <button
              key={m.id}
              className={`filter-chip ${activeMetric === m.id ? "active" : ""}`}
              onClick={() => setActiveMetric(m.id)}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
        <div className="filter-chips-row">
          {["All", "POLITICIAN", "BUREAUCRAT"].map((r) => (
            <button
              key={r}
              className={`filter-chip ${roleFilter === r ? "active" : ""}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === "All" ? "🌐 All" : r === "POLITICIAN" ? "🧑‍💼 Politicians" : "🏢 Bureaucrats"}
            </button>
          ))}
        </div>
      </div>

      {metric && (
        <div className="lb-metric-desc">
          <span>{metric.icon}</span>
          <span><strong>{metric.label}:</strong> {metric.desc}</span>
          {metric.higherIsBad && (
            <span className="lb-warning-badge">⚠️ Higher is worse</span>
          )}
        </div>
      )}

      {loading && <div className="loading"><div className="loading-spinner" />Loading leaderboard...</div>}
      {error && <div className="error-msg">Failed to load officials.</div>}

      <div className="leaderboard-list">
        {ranked.map((official, i) => (
          <RankCard
            key={official.id}
            rank={i + 1}
            official={official}
            metric={activeMetric}
            onSelect={onSelectOfficial}
          />
        ))}
      </div>

      {!loading && ranked.length === 0 && (
        <div className="empty-state">No data available.</div>
      )}
    </div>
  );
}
