// scraper.js — Google News RSS scraper for Neta Watch
// Fetches live news headlines for each tracked official
// Runs as a background daemon every 30 minutes

import db, { newsCache } from "./_db.js";

const SCRAPE_INTERVAL_MS = 30 * 60 * 1000; // 30 min

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .trim();
}

async function fetchNewsForOfficial(official) {
  const query = encodeURIComponent(`"${official.name}" India ${official.level === "NATIONAL" ? "parliament minister" : "politician government"}`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "NetaWatch/2.0 (open-source political accountability; contact: netawatch@example.com)",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[Scraper] HTTP ${res.status} for "${official.name}"`);
      return [];
    }

    const xml = await res.text();
    const headlines = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && headlines.length < 5) {
      const chunk = match[1];

      // Title — handle CDATA
      const titleMatch =
        chunk.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
        chunk.match(/<title>([\s\S]*?)<\/title>/);

      // Link — after the first <link> in item
      const linkMatch = chunk.match(/<link>\s*(https?:\/\/[^\s<]+)\s*<\/link>/);

      const dateMatch = chunk.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch =
        chunk.match(/<source[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/source>/) ||
        chunk.match(/<source[^>]*>([\s\S]*?)<\/source>/);

      const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : null;
      const link = linkMatch ? linkMatch[1].trim() : null;
      const pubDate = dateMatch ? dateMatch[1].trim() : new Date().toISOString();
      const source = sourceMatch ? decodeHtmlEntities(sourceMatch[1]) : "Google News";

      if (title && link && title.length > 8) {
        headlines.push({ title, url: link, source, publishedAt: pubDate });
      }
    }

    return headlines;
  } catch (err) {
    if (err.name !== "AbortError") {
      console.warn(`[Scraper] Error for "${official.name}": ${err.message}`);
    }
    return [];
  }
}

export async function scrapeAll() {
  const officials = db.officials;
  let successCount = 0;

  console.log(`[Scraper] Scraping news for ${officials.length} officials...`);

  for (const official of officials) {
    const headlines = await fetchNewsForOfficial(official);
    if (headlines.length > 0) {
      // Merge with existing cache (keep old if scrape returns nothing)
      const existing = newsCache.get(official.id) || [];
      newsCache.set(official.id, headlines);
      successCount++;
    }
    // Throttle: 2.5s between requests to avoid rate limiting
    await new Promise((r) => setTimeout(r, 2500));
  }

  console.log(`[Scraper] Done — ${successCount}/${officials.length} officials updated.`);
}

export async function scrapeOne(officialId) {
  const official = db.officials.find((o) => o.id === officialId);
  if (!official) return false;
  const headlines = await fetchNewsForOfficial(official);
  if (headlines.length > 0) {
    newsCache.set(officialId, headlines);
  }
  return true;
}

export function startScraperDaemon() {
  // First run after 10s startup delay (let server settle)
  setTimeout(() => scrapeAll().catch(console.error), 10000);
  setInterval(() => scrapeAll().catch(console.error), SCRAPE_INTERVAL_MS);
  console.log(`[Scraper] Daemon started — runs every ${SCRAPE_INTERVAL_MS / 60000}min.`);
}
