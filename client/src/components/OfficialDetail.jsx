import { useQuery } from "@apollo/client/react";
import { GET_OFFICIAL } from "../graphql";
import { getInitials } from "../utils";

function formatBudget(amount) {
  if (!amount) return "N/A";
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)} L`;
  return `${amount.toLocaleString("en-IN")}`;
}

function BudgetBar({ allotted, spent }) {
  if (!allotted) return null;
  const pct = Math.min(((spent || 0) / allotted) * 100, 100);
  const color =
    pct > 80 ? "var(--red)" : pct > 50 ? "var(--orange)" : "var(--green)";

  return (
    <div className="promise-budget">
      <div className="budget-bar-bg">
        <div
          className="budget-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="budget-labels">
        <span>Spent: {formatBudget(spent)}</span>
        <span>Allotted: {formatBudget(allotted)}</span>
      </div>
    </div>
  );
}

export default function OfficialDetail({ id, onBack }) {
  const { loading, error, data } = useQuery(GET_OFFICIAL, {
    variables: { id },
  });

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-msg">Error loading official.</div>;

  const o = data?.official;
  if (!o) return <div className="error-msg">Official not found.</div>;

  const initials = getInitials(o.name);

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        &larr; Back
      </button>

      <div className="detail-header">
        <div className="detail-avatar">{initials}</div>
        <div className="detail-info">
          <h1>{o.name}</h1>
          <div className="meta">
            {o.position} | {o.department || "N/A"} |{" "}
            {o.district ? `${o.district}, ` : ""}
            {o.state}
          </div>
          <div className="detail-badges">
            <span className={`badge ${o.role.toLowerCase()}`}>{o.role}</span>
            {o.party && <span className="badge state">{o.party}</span>}
          </div>
        </div>
      </div>

      {/* Promises */}
      <div className="section">
        <h2 className="section-title">
          Promises
          <span className="count-badge">{o.promises.length}</span>
        </h2>
        {o.promises.length === 0 && (
          <div className="empty-state">No promises on record.</div>
        )}
        {o.promises.map((p) => (
          <div className="promise-card" key={p.id}>
            <div className="card-footer" className="card-footer-top">
              <span className={`status ${p.status.toLowerCase()}`}>
                {p.status.replaceAll("_", " ")}
              </span>
            </div>
            <h4>{p.title}</h4>
            {p.description && <p>{p.description}</p>}
            <BudgetBar allotted={p.budgetAllotted} spent={p.budgetSpent} />
            {p.sourceUrl && (
              <a
                href={p.sourceUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 13, color: "var(--accent)" }}
              >
                Source
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Allegations */}
      <div className="section">
        <h2 className="section-title">
          Allegations
          <span className="count-badge">{o.allegations.length}</span>
        </h2>
        {o.allegations.length === 0 && (
          <div className="empty-state">No allegations on record.</div>
        )}
        {o.allegations.map((a) => (
          <div className="allegation-card" key={a.id}>
            <div className="card-footer" className="card-footer-top">
              <span className={`severity ${a.severity.toLowerCase()}`}>
                {a.severity} severity
              </span>
              <span className={`status ${a.status.toLowerCase()}`}>
                {a.status}
              </span>
            </div>
            <h4>{a.title}</h4>
            {a.description && <p>{a.description}</p>}
          </div>
        ))}
      </div>

      {/* Claims */}
      <div className="section">
        <h2 className="section-title">
          Public Claims
          <span className="count-badge">{o.claims.length}</span>
        </h2>
        {o.claims.length === 0 && (
          <div className="empty-state">No claims submitted yet.</div>
        )}
        {o.claims.map((c) => (
          <div className="claim-card" key={c.id}>
            <div className="card-footer" className="card-footer-top">
              <span className={`status ${c.status.toLowerCase()}`}>
                {c.status}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                by {c.submittedBy}
              </span>
            </div>
            <h4>{c.title}</h4>
            <p>{c.description}</p>
            {c.aiVerificationNote && (
              <div className="ai-note">
                <strong style={{ color: "var(--accent)" }}>AI Note:</strong>{" "}
                {c.aiVerificationNote}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
