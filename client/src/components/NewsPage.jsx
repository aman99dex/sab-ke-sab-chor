import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_NEWS } from "../graphql";

const SOURCE_COLORS = {
  "Times of India": "#e63946",
  "The Hindu": "#1a6b3c",
  "NDTV": "#e63946",
  "Indian Express": "#0077b6",
  "Hindustan Times": "#c00",
  "The Wire": "#6366f1",
  "Scroll.in": "#2d6a4f",
  "Live Law": "#774936",
};

function NewsCard({ article, onSelectOfficial }) {
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "—";
  const srcColor = SOURCE_COLORS[article.source] || "var(--accent)";
  const sentimentIcon = article.sentiment === "POSITIVE" ? "📈" : article.sentiment === "NEGATIVE" ? "📉" : "📊";

  return (
    <article className="news-feed-card">
      <div className="nfc-header">
        <div className="nfc-meta">
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
            color: srcColor, background: `${srcColor}15`, border: `1px solid ${srcColor}35`,
            padding: "2px 8px", borderRadius: 4,
          }}>{article.source}</span>
          {article.sentiment && <span title={`Sentiment: ${article.sentiment}`}>{sentimentIcon}</span>}
          {article.category && (
            <span style={{ fontSize: 10, color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>
              {article.category}
            </span>
          )}
        </div>
        <span className="date-label">{date}</span>
      </div>

      <h3 className="nfc-title">
        <a href={article.url} target="_blank" rel="noreferrer">{article.title}</a>
      </h3>

      {article.officials && article.officials.length > 0 && (
        <div className="nfc-officials">
          {article.officials.map((o) => (
            <button key={o.id} className="official-chip sm" onClick={() => onSelectOfficial(o.id)}>
              {o.name} · {o.state}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

export default function NewsPage({ onSelectOfficial }) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All");

  const { data, loading, error, refetch } = useQuery(GET_NEWS, { variables: { limit: 100 } });
  const articles = data?.newsArticles || [];

  const sources = useMemo(() => {
    const s = [...new Set(articles.map((a) => a.source))].sort();
    return ["All", ...s];
  }, [articles]);

  const filtered = articles.filter((a) => {
    const matchSrc = sourceFilter === "All" || a.source === sourceFilter;
    const matchQ = !search || a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.officials?.some((o) => o.name?.toLowerCase().includes(search.toLowerCase()));
    return matchSrc && matchQ;
  });

  const handleRefresh = async () => {
    await fetch("/api/scrape/trigger", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setTimeout(() => refetch(), 3000);
  };

  return (
    <div className="full-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">📰 Live News Feed</h2>
          <p className="page-subtitle">Real-time news scraped from Indian media — updated every 30 minutes</p>
        </div>
        <div className="page-header-actions">
          <div className="phs-item">
            <span className="phs-val">{filtered.length}</span>
            <span className="phs-label">Articles</span>
          </div>
          <button className="btn-ghost" onClick={handleRefresh} style={{ fontSize: 13 }}>
            ↻ Refresh Now
          </button>
        </div>
      </div>

      <div className="page-filters">
        <div className="search-wrap" style={{ flex: 1, maxWidth: 380 }}>
          <span className="search-icon">🔍</span>
          <input
            className="search-box"
            type="text"
            placeholder="Search headlines, officials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch("")}>✕</button>}
        </div>
        <div className="filter-chips-row" style={{ flexWrap: "wrap" }}>
          {sources.map((s) => (
            <button
              key={s}
              className={`filter-chip ${sourceFilter === s ? "active" : ""}`}
              onClick={() => setSourceFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="loading"><div className="loading-spinner" />Loading news...</div>}
      {error && <div className="error-msg">Failed to load news.</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: 40, marginBottom: 12 }}>📰</div>
          No articles match your search.
          <br />
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={handleRefresh}>
            Fetch Latest News
          </button>
        </div>
      )}

      <div className="news-feed-grid">
        {filtered.map((a) => (
          <NewsCard key={a.id} article={a} onSelectOfficial={onSelectOfficial} />
        ))}
      </div>
    </div>
  );
}
