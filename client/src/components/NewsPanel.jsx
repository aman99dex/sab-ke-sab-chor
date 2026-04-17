import { useState } from "react";

function formatDate(dateStr) {
  if (!dateStr) return "Unknown date";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function SourceBadge({ source }) {
  const colorMap = {
    "Times of India": "#e63946",
    "The Hindu": "#1a1a2e",
    "NDTV": "#e63946",
    "Indian Express": "#0077b6",
    "Hindustan Times": "#e63946",
    "The Wire": "#6366f1",
    "Scroll.in": "#2d6a4f",
    "Live Law": "#774936",
    "Deccan Chronicle": "#780000",
    "Mathrubhumi": "#d62828",
    "The Telegraph": "#0a1128",
  };
  const color = colorMap[source] || "var(--text-muted)";

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        padding: "2px 7px",
        borderRadius: 4,
        flexShrink: 0,
      }}
    >
      {source}
    </span>
  );
}

export default function NewsPanel({ headlines, onTriggerScrape }) {
  const [expanded, setExpanded] = useState({});

  if (!headlines || headlines.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px",
          color: "var(--text-muted)",
          fontSize: 14,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>📰</div>
        <div>No news headlines cached yet.</div>
        <div style={{ marginTop: 6, fontSize: 13 }}>
          The scraper runs every 30 minutes.{" "}
          {onTriggerScrape && (
            <button
              onClick={onTriggerScrape}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-bright)",
                cursor: "pointer",
                fontSize: 13,
                textDecoration: "underline",
                padding: 0,
              }}
            >
              Fetch now →
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="news-panel">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {headlines.length} headlines • auto-refreshes every 30 min
        </span>
        {onTriggerScrape && (
          <button className="scrape-btn" onClick={onTriggerScrape}>
            ↻ Refresh
          </button>
        )}
      </div>

      <div className="news-list">
        {headlines.map((h, i) => (
          <article key={i} className="news-item">
            <div className="news-item-header">
              <div className="news-item-title">
                <a href={h.url} target="_blank" rel="noreferrer">
                  {h.title}
                </a>
              </div>
              <SourceBadge source={h.source} />
            </div>
            <div className="news-item-meta">
              <span>📅 {formatDate(h.publishedAt)}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
