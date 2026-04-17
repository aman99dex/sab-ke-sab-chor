import { useQuery } from "@apollo/client/react";
import { GET_STATS_SUMMARY, GET_OFFICIALS, GET_CLAIMS } from "../graphql";
import LevelBadge from "./LevelBadge";

function StatBox({ icon, label, value, color = "var(--text-primary)", bg = "var(--bg-card)" }) {
  return (
    <div className="dash-stat-box" style={{ background: bg }}>
      <div className="dsb-icon">{icon}</div>
      <div className="dsb-val" style={{ color }}>{value?.toLocaleString("en-IN") ?? "—"}</div>
      <div className="dsb-label">{label}</div>
    </div>
  );
}

const LEVEL_ORDER = ["NATIONAL", "STATE", "DISTRICT", "BLOCK", "PANCHAYAT"];

export default function DashboardPage({ onSelectOfficial }) {
  const { data: statsData } = useQuery(GET_STATS_SUMMARY);
  const { data: officialsData } = useQuery(GET_OFFICIALS, { variables: {} });
  const { data: claimsData } = useQuery(GET_CLAIMS, { variables: { status: "PENDING" } });

  const stats = statsData?.statsSummary;
  const officials = officialsData?.officials || [];
  const pendingClaims = claimsData?.claims || [];

  // Group officials by level
  const byLevel = LEVEL_ORDER.reduce((acc, level) => {
    acc[level] = officials.filter((o) => o.level === level);
    return acc;
  }, {});

  return (
    <div className="dashboard-page">
      <h2 className="section-title" style={{ marginBottom: 24 }}>
        📊 Platform Dashboard
        <span className="count-badge">Live Data</span>
      </h2>

      {/* Stats Grid */}
      {stats && (
        <div className="dash-stats-grid">
          <StatBox icon="👤" label="Total Officials" value={stats.totalOfficials} color="var(--accent-bright)" />
          <StatBox icon="🧑‍💼" label="Politicians" value={stats.totalPoliticians} color="var(--blue-bright)" />
          <StatBox icon="🏢" label="Bureaucrats" value={stats.totalBureaucrats} color="var(--orange-bright)" />
          <StatBox icon="📋" label="Promises" value={stats.totalPromises} color="var(--text-primary)" />
          <StatBox icon="✅" label="Fulfilled" value={stats.completedPromises} color="var(--green)" />
          <StatBox icon="⏳" label="In Progress" value={stats.pendingPromises} color="var(--blue)" />
          <StatBox icon="⚠️" label="Allegations" value={stats.totalAllegations} color="var(--orange)" />
          <StatBox icon="🔴" label="High Severity" value={stats.highSeverityAllegations} color="var(--red)" />
          <StatBox icon="🔍" label="Claims" value={stats.totalClaims} color="var(--text-primary)" />
          <StatBox icon="🕐" label="Pending Claims" value={stats.pendingClaims} color="var(--orange)" />
          <StatBox icon="✔️" label="Verified Claims" value={stats.verifiedClaims} color="var(--green)" />
          <StatBox icon="🗺️" label="States Covered" value={stats.statesTracked} color="var(--purple)" />
        </div>
      )}

      {/* Officials by Level */}
      <div className="dash-section">
        <h3 className="dash-section-title">Officials by Political Level</h3>
        <div className="level-breakdown">
          {LEVEL_ORDER.map((level) => {
            const off = byLevel[level] || [];
            if (off.length === 0) return null;
            return (
              <div key={level} className="level-group">
                <div className="level-group-header">
                  <LevelBadge level={level} size="md" />
                  <span className="level-count">{off.length} official{off.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="level-official-list">
                  {off.map((o) => (
                    <button
                      key={o.id}
                      className="level-official-item"
                      onClick={() => onSelectOfficial(o.id)}
                    >
                      <div>
                        <strong>{o.name}</strong>
                        <span className="level-item-sub">{o.position} · {o.state}</span>
                      </div>
                      {o.criminalCases > 0 && (
                        <span style={{ color: "var(--red)", fontSize: 11, fontWeight: 700 }}>
                          ⚠️{o.criminalCases}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Claims */}
      {pendingClaims.length > 0 && (
        <div className="dash-section">
          <h3 className="dash-section-title">
            🔍 Pending Citizen Claims
            <span className="count-badge" style={{ color: "var(--orange)" }}>{pendingClaims.length}</span>
          </h3>
          <div className="pending-claims-list">
            {pendingClaims.slice(0, 10).map((c) => (
              <div key={c.id} className="pending-claim-item">
                <div>
                  <div className="pci-title">{c.title}</div>
                  <div className="pci-meta">
                    {c.official?.name} · {c.official?.state} ·{" "}
                    <span className="claim-type-badge sm">{c.type.replaceAll("_", " ")}</span>
                  </div>
                </div>
                <span className="status pending">PENDING</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
