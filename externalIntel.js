const CACHE_TTL_MS = 30 * 60 * 1000;

const memoryCache = new Map();

function getCached(key, ttlMs = CACHE_TTL_MS) {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.timestamp > ttlMs) {
    memoryCache.delete(key);
    return null;
  }
  return hit.data;
}

function setCached(key, data) {
  memoryCache.set(key, {
    timestamp: Date.now(),
    data,
  });
  return data;
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "NetaWatch/3.0",
        "Accept": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function dedupeByUrl(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.sourceUrl || seen.has(item.sourceUrl)) return false;
    seen.add(item.sourceUrl);
    return true;
  });
}

async function searchWikipedia(query, limit = 8) {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${Math.min(limit, 12)}&format=json&utf8=1&origin=*`;
  const searchJson = await fetchJsonWithTimeout(searchUrl, {}, 8000);
  const results = searchJson?.query?.search || [];

  const summaries = await Promise.all(
    results.slice(0, limit).map(async (result) => {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title)}`;
      const summaryJson = await fetchJsonWithTimeout(summaryUrl, {}, 8000);
      if (!summaryJson) return null;

      return {
        name: summaryJson.title || result.title,
        snippet: summaryJson.extract || result.snippet?.replaceAll(/<[^>]+>/g, "") || "",
        image: summaryJson.thumbnail?.source || null,
        sourceUrl: summaryJson.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
        source: "Wikipedia",
      };
    })
  );

  return summaries.filter(Boolean);
}

async function searchGoogleCse(query, limit = 8) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  if (!apiKey || !cseId) return [];

  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cseId)}&q=${encodeURIComponent(query)}&num=${Math.min(limit, 10)}&safe=off&gl=in`;
  const json = await fetchJsonWithTimeout(url, {}, 9000);
  const items = json?.items || [];

  return items.map((item) => ({
    name: item.title?.split(" - ")[0] || item.title || "Unknown",
    snippet: item.snippet || "",
    image: item.pagemap?.cse_image?.[0]?.src || null,
    sourceUrl: item.link,
    source: "Google CSE",
  }));
}

async function searchDuckDuckGo(query, limit = 8) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const json = await fetchJsonWithTimeout(url, {}, 7000);
  const topics = json?.RelatedTopics || [];

  const flattened = [];
  for (const topic of topics) {
    if (topic?.Topics?.length) {
      flattened.push(...topic.Topics);
    } else {
      flattened.push(topic);
    }
  }

  return flattened
    .slice(0, limit)
    .map((item) => {
      const text = item?.Text || "";
      const [name] = text.split(" - ");
      return {
        name: name || "Unknown",
        snippet: text,
        image: null,
        sourceUrl: item?.FirstURL || null,
        source: "DuckDuckGo",
      };
    })
    .filter((item) => item.sourceUrl);
}

export async function searchPeopleGlobal(rawQuery, options = {}) {
  const query = String(rawQuery || "").trim();
  if (query.length < 2) return [];

  const limit = Math.max(1, Math.min(Number(options.limit) || 8, 15));
  const cacheKey = `people:search:${query.toLowerCase()}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const enrichedQuery = `${query} india politician bureaucrat`; 

  const [googleItems, wikiItems, ddgItems] = await Promise.all([
    searchGoogleCse(enrichedQuery, limit),
    searchWikipedia(enrichedQuery, limit),
    searchDuckDuckGo(enrichedQuery, limit),
  ]);

  const merged = dedupeByUrl([...googleItems, ...wikiItems, ...ddgItems]).slice(0, limit);
  return setCached(cacheKey, merged);
}

export async function getPersonProfile(rawName) {
  const name = String(rawName || "").trim();
  if (!name) return null;

  const cacheKey = `people:profile:${name.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
  const summary = await fetchJsonWithTimeout(summaryUrl, {}, 8000);
  const links = await searchPeopleGlobal(name, { limit: 6 });

  const profile = {
    name,
    title: summary?.title || name,
    bio: summary?.extract || "No biography found from public sources.",
    image: summary?.thumbnail?.source || links.find((link) => link.image)?.image || null,
    sourceUrl: summary?.content_urls?.desktop?.page || links[0]?.sourceUrl || null,
    links,
    retrievedAt: new Date().toISOString(),
  };

  return setCached(cacheKey, profile);
}

export function getExternalIntelCacheStats() {
  return {
    entries: memoryCache.size,
    ttlMs: CACHE_TTL_MS,
  };
}
