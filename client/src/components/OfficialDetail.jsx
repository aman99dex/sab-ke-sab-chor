import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_OFFICIAL } from "../graphql";
import { getInitials } from "../utils";
import LevelBadge from "./LevelBadge";
import NewsPanel from "./NewsPanel";

function formatBudget(amount) {
  if (!amount) return "N/A";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function BudgetBar({ allotted, spent }) {
  if (!allotted) return null;
  const pct = Math.min(((spent || 0) / allotted) * 100, 100);
  const color = pct > 85 ? "var(--red)" : pct > 55 ? "var(--orange)" : "var(--green)";
  return (
    <div className="budget-wrap">
      <div className="budget-bar-bg">
        <div className="budget-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="budget-labels">
        <span>Spent: {formatBudget(spent)}</span>
        <span>{pct.toFixed(0)}% of {formatBudget(allotted)}</span>
      </div>
    </div>
  );
}

function AiBadge({ note, confidence }) {
  if (!note) return null;
  const isVerified = note.includes("factually verified");
  const isFalse = note.includes("likely false");
  const color = isVerified ? "var(--green)" : isFalse ? "var(--red)" : "var(--orange)";
  const icon = isVerified ? "✅" : isFalse ? "❌" : "🔍";

  return (
    <div className="ai-badge">
      <span className="ai-badge-icon">{icon}</span>
      <div>
        <div className="ai-badge-header" style={{ color }}>
          AI Verification {confidence != null ? `(${confidence}% confidence)` : ""}
        </div>
        <div className="ai-badge-text">{note}</div>
      </div>
    </div>
  );
}

const TABS = ["Overview", "Promises", "Allegations", "Court Cases", "Claims", "News", "Assets"];

export default function OfficialDetail({ id, onBack }) {
  const [activeTab, setActiveTab] = useState("Overview");

  const { loading, error, data, refetch } = useQuery(GET_OFFICIAL, { variables: { id } });

  if (loading) return <div className="loading"><div className="loading-spinner" /> Loading...</div>;
  if (error) return <div className="error-msg">Error loading official.</div>;

  const o = data?.official;
  if (!o) return <div className="error-msg">Official not found.</div>;

  const initials = getInitials(o.name);

  const handleScrape = async () => {
    await fetch("/api/scrape/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ officialId: id }),
    });
    setTimeout(() => refetch(), 1200);
  };

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={onBack}>← Back to Officials</button>

      {/* Detail Header */}
      <div className="detail-header">
        <div className="detail-avatar">{initials}</div>
        <div className="detail-info">
          <h1>{o.name}</h1>
          <div className="detail-position">{o.position}</div>
          {o.constituency && (
            <div className="detail-constituency">
              📍 {o.constituency}{o.constituencyType ? ` (${o.constituencyType})` : ""}
            </div>
          )}
          <div className="detail-location">
            {o.district ? `${o.district}, ` : ""}{o.state}
          </div>
          <div className="detail-badges">
            <LevelBadge level={o.level} size="md" />
            <span className={`badge ${o.role.toLowerCase()}`}>{o.role}</span>
            {o.party && <span className="badge party">{o.party}</span>}
            {o.criminalCases > 0 && (
              <span className="badge danger">⚠️ {o.criminalCases} Criminal Cases</span>
            )}
          </div>
        </div>
        <div className="detail-header-stats">
          <div className="detail-quick-stat">
            <span className="dqs-val">{o.promises.length}</span>
            <span className="dqs-label">Promises</span>
          </div>
          <div className="detail-quick-stat">
            <span className="dqs-val">{o.allegations.length}</span>
            <span className="dqs-label">Allegations</span>
          </div>
          <div className="detail-quick-stat">
            <span className="dqs-val">{o.claims.length}</span>
            <span className="dqs-label">Claims</span>
          </div>
          <div className="detail-quick-stat">
            <span className="dqs-val">{o.newsArticles?.length || 0}</span>
            <span className="dqs-label">News</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "Claims" && o.claims.filter(c => c.status === "PENDING").length > 0 && (
              <span className="tab-badge">{o.claims.filter(c => c.status === "PENDING").length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">

        {/* OVERVIEW */}
        {activeTab === "Overview" && (
          <div className="overview-grid">
            <div className="overview-card">
              <h3>📋 Summary</h3>
              <div className="overview-rows">
                <div className="ov-row"><span>Party</span><strong>{o.party || "Non-partisan"}</strong></div>
                <div className="ov-row"><span>Position</span><strong>{o.position}</strong></div>
                <div className="ov-row"><span>Department</span><strong>{o.department || "—"}</strong></div>
                <div className="ov-row"><span>Constituency</span><strong>{o.constituency || "—"}</strong></div>
                <div className="ov-row"><span>State</span><strong>{o.state}</strong></div>
                {o.termStart && (
                  <div className="ov-row"><span>Term</span><strong>{formatDate(o.termStart)} → {o.termEnd ? formatDate(o.termEnd) : "Present"}</strong></div>
                )}
              </div>
            </div>
            <div className="overview-card">
              <h3>📊 Track Record</h3>
              <div className="overview-rows">
                <div className="ov-row">
                  <span>Promises</span>
                  <strong style={{ color: "var(--blue-bright)" }}>{o.promises.length}</strong>
                </div>
                <div className="ov-row">
                  <span>Completed</span>
                  <strong style={{ color: "var(--green)" }}>
                    {o.promises.filter((p) => p.status === "COMPLETED").length}
                  </strong>
                </div>
                <div className="ov-row">
                  <span>Allegations</span>
                  <strong style={{ color: "var(--orange)" }}>{o.allegations.length}</strong>
                </div>
                <div className="ov-row">
                  <span>High Severity</span>
                  <strong style={{ color: "var(--red)" }}>
                    {o.allegations.filter((a) => a.severity === "HIGH").length}
                  </strong>
                </div>
                <div className="ov-row">
                  <span>Citizen Claims</span>
                  <strong>{o.claims.length}</strong>
                </div>
                <div className="ov-row">
                  <span>Verified Claims</span>
                  <strong style={{ color: "var(--green)" }}>
                    {o.claims.filter((c) => c.status === "VERIFIED").length}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROMISES */}
        {activeTab === "Promises" && (
          <div>
            {o.promises.length === 0 && <div className="empty-state">No promises on record.</div>}
            {o.promises.map((p) => (
              <div className="promise-card" key={p.id}>
                <div className="card-row-top">
                  <span className={`status ${p.status.toLowerCase()}`}>{p.status.replaceAll("_", " ")}</span>
                  {p.deadline && <span className="deadline">🗓️ Due: {formatDate(p.deadline)}</span>}
                </div>
                <h4>{p.title}</h4>
                {p.description && <p>{p.description}</p>}
                <BudgetBar allotted={p.budgetAllotted} spent={p.budgetSpent} />
                <div className="card-footer">
                  {p.sourceUrl && (
                    <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
                      🔗 Source
                    </a>
                  )}
                  <span className="date-label">Updated {formatDate(p.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ALLEGATIONS */}
        {activeTab === "Allegations" && (
          <div>
            {o.allegations.length === 0 && <div className="empty-state">No allegations on record.</div>}
            {o.allegations.map((a) => (
              <div className="allegation-card" key={a.id}>
                <div className="card-row-top">
                  <span className={`severity ${a.severity.toLowerCase()}`}>{a.severity} Severity</span>
                  <span className={`status ${a.status.toLowerCase()}`}>{a.status}</span>
                </div>
                <h4>{a.title}</h4>
                {a.description && <p>{a.description}</p>}
                <div className="card-footer">
                  {a.sourceUrl && (
                    <a href={a.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
                      🔗 Source
                    </a>
                  )}
                  <span className="date-label">Filed {formatDate(a.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* COURT CASES */}
        {activeTab === "Court Cases" && (
          <div>
            {(!o.courtCases || o.courtCases.length === 0) && (
              <div className="empty-state">No court cases on record.</div>
            )}
            {(o.courtCases || []).map((cc) => (
              <div className="allegation-card" key={cc.id}>
                <div className="card-row-top">
                  <span className={`status ${cc.status.toLowerCase().replace(/ /g, "_")}`}>
                    {cc.status}
                  </span>
                  <span className="claim-type-badge">{cc.caseType}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
                    🏛️ {cc.court}
                  </span>
                </div>
                <h4>Case No: {cc.caseNumber}</h4>
                {cc.charges && cc.charges.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {cc.charges.map((ch, i) => (
                      <span key={i} className="claim-type-badge sm">{ch}</span>
                    ))}
                  </div>
                )}
                {cc.judgmentSummary && <p>{cc.judgmentSummary}</p>}
                <div className="card-footer">
                  {cc.filingDate && (
                    <span className="date-label">Filed {formatDate(cc.filingDate)}</span>
                  )}
                  {cc.lastHearingDate && (
                    <span className="date-label">Last hearing {formatDate(cc.lastHearingDate)}</span>
                  )}
                  {cc.nextHearingDate && (
                    <span className="date-label" style={{ color: "var(--orange)" }}>
                      Next {formatDate(cc.nextHearingDate)}
                    </span>
                  )}
                  {cc.sourceUrl && (
                    <a href={cc.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
                      🔗 Source
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CLAIMS */}
        {activeTab === "Claims" && (
          <div>
            {o.claims.length === 0 && <div className="empty-state">No citizen claims submitted yet.</div>}
            {o.claims.map((c) => (
              <div className="claim-card" key={c.id}>
                <div className="card-row-top">
                  <span className={`status ${c.status.toLowerCase()}`}>{c.status}</span>
                  <span className="claim-type-badge">{c.type.replaceAll("_", " ")}</span>
                  <span className="submitted-by">by {c.submittedBy}</span>
                </div>
                <h4>{c.title}</h4>
                <p>{c.description}</p>
                <AiBadge note={c.aiVerificationNote} confidence={c.aiConfidence} />
                <div className="card-footer">
                  <span className="date-label">Submitted {formatDate(c.createdAt)}</span>
                  {c.verifiedAt && <span className="date-label">Verified {formatDate(c.verifiedAt)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NEWS */}
        {activeTab === "News" && (
          <NewsPanel headlines={o.newsArticles} onTriggerScrape={handleScrape} />
        )}

        {/* ASSETS */}
        {activeTab === "Assets" && (
          <div className="assets-panel">
            <div className="overview-card">
              <h3>💰 Declared Assets & Background</h3>
              <div className="overview-rows">
                <div className="ov-row">
                  <span>Net Worth</span>
                  <strong style={{ color: "var(--green-bright)", fontSize: 18 }}>
                    {o.assets ? formatBudget(o.assets) : "Not declared"}
                  </strong>
                </div>
                <div className="ov-row">
                  <span>Criminal Cases</span>
                  <strong style={{ color: o.criminalCases > 0 ? "var(--red)" : "var(--green)" }}>
                    {o.criminalCases ?? "—"}
                    {o.criminalCases === 0 ? " (Clean)" : o.criminalCases > 0 ? " (Pending)" : ""}
                  </strong>
                </div>
                <div className="ov-row">
                  <span>Education</span>
                  <strong>{o.educationQualification || "Not declared"}</strong>
                </div>
                <div className="ov-row">
                  <span>Term</span>
                  <strong>
                    {o.termStart ? formatDate(o.termStart) : "—"} →{" "}
                    {o.termEnd ? formatDate(o.termEnd) : "Present"}
                  </strong>
                </div>
                {o.websiteUrl && (
                  <div className="ov-row">
                    <span>Website</span>
                    <a href={o.websiteUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent-bright)" }}>
                      {o.websiteUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                marginTop: 16,
                padding: "14px 18px",
                background: "rgba(99,102,241,0.05)",
                border: "1px solid rgba(99,102,241,0.15)",
                borderRadius: 12,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              ℹ️ Data sourced from Election Commission of India affidavits (Form 26).
              Assets declared at time of nomination filing. May not reflect current net worth.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
