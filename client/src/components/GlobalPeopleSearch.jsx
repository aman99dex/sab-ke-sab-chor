import { useEffect, useMemo, useState } from "react";

const SEARCH_CACHE_PREFIX = "neta:global-search:";
const PROFILE_CACHE_PREFIX = "neta:person-profile:";
const CACHE_TTL_MS = 30 * 60 * 1000;

function getProxiedImageUrl(rawUrl) {
  if (!rawUrl) return null;
  return `/api/images/proxy?url=${encodeURIComponent(rawUrl)}`;
}

function readSessionCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeSessionCache(key, data) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore quota errors for transient cache.
  }
}

export default function GlobalPeopleSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const trimmed = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]);
      setError("");
      return;
    }

    const timer = setTimeout(async () => {
      const cacheKey = `${SEARCH_CACHE_PREFIX}${trimmed.toLowerCase()}`;
      const cached = readSessionCache(cacheKey);
      if (cached) {
        setResults(cached);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/people/search?q=${encodeURIComponent(trimmed)}&limit=8`);
        const json = await response.json();
        if (!response.ok) {
          setError(json?.error || "Global search failed.");
          setResults([]);
          return;
        }
        const nextResults = json?.results || [];
        setResults(nextResults);
        writeSessionCache(cacheKey, nextResults);
      } catch {
        setError("Global search request failed. Is backend running?");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [trimmed]);

  async function loadProfile(name) {
    const cacheKey = `${PROFILE_CACHE_PREFIX}${name.toLowerCase()}`;
    const cached = readSessionCache(cacheKey);
    if (cached) {
      setSelectedProfile(cached);
      return;
    }

    setProfileLoading(true);
    try {
      const response = await fetch(`/api/people/profile?name=${encodeURIComponent(name)}`);
      const json = await response.json();
      if (!response.ok) return;
      setSelectedProfile(json);
      writeSessionCache(cacheKey, json);
    } catch {
      // Ignore profile read failures to keep search responsive.
    } finally {
      setProfileLoading(false);
    }
  }

  return (
    <section className="global-search-section">
      <div className="global-search-head">
        <h3>Global Person Search</h3>
        <span>Google-capable + open web intelligence</span>
      </div>
      <div className="global-search-input-wrap">
        <input
          className="search-box"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search globally: person, alias, constituency, case..."
        />
      </div>

      {loading && <div className="result-count">Searching public web sources...</div>}
      {error && <div className="error-msg">{error}</div>}

      {results.length > 0 && (
        <div className="global-results-grid">
          {results.map((item) => (
            <article key={item.sourceUrl} className="global-result-card">
              <div className="global-result-top">
                {item.image ? (
                  <img src={getProxiedImageUrl(item.image)} alt={item.name} loading="lazy" />
                ) : (
                  <div className="global-avatar-fallback">{(item.name || "?").slice(0, 2).toUpperCase()}</div>
                )}
                <div>
                  <h4>{item.name}</h4>
                  <span>{item.source}</span>
                </div>
              </div>

              <p>{item.snippet || "No description available."}</p>
              <div className="global-result-actions">
                <button className="btn-ghost" onClick={() => loadProfile(item.name)}>Deep Profile</button>
                <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="btn-ghost">
                  Open Source
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {(profileLoading || selectedProfile) && (
        <div className="profile-preview">
          {profileLoading ? (
            <div className="result-count">Loading profile intelligence...</div>
          ) : (
            <>
              <div className="profile-preview-top">
                {selectedProfile.image ? (
                  <img src={getProxiedImageUrl(selectedProfile.image)} alt={selectedProfile.title} loading="lazy" />
                ) : (
                  <div className="global-avatar-fallback">{(selectedProfile.title || "?").slice(0, 2).toUpperCase()}</div>
                )}
                <div>
                  <h4>{selectedProfile.title}</h4>
                  {selectedProfile.sourceUrl && (
                    <a href={selectedProfile.sourceUrl} target="_blank" rel="noreferrer">
                      Main profile source
                    </a>
                  )}
                </div>
              </div>
              <p>{selectedProfile.bio}</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
