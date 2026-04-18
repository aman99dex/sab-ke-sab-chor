// scraper.js — Google News RSS scraper for Neta Watch
// Fetches live news headlines for each tracked official
// Now stores results in database via Prisma

import prisma from "./db.js";

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
        "User-Agent": "NetaWatch/3.0 (open-source political accountability; contact: netawatch@example.com)",
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

      const titleMatch =
        chunk.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
        chunk.match(/<title>([\s\S]*?)<\/title>/);

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

export async function scrapeAll(options = {}) {
  const { onProgress } = options;
  const officials = await prisma.official.findMany({
    select: { id: true, name: true, level: true },
  });
  let successCount = 0;

  console.log(`[Scraper] Scraping news for ${officials.length} officials...`);

  for (let index = 0; index < officials.length; index += 1) {
    const official = officials[index];
    const headlines = await fetchNewsForOfficial(official);
    const updated = headlines.length > 0;

    if (headlines.length > 0) {
      for (const h of headlines) {
        try {
          // Upsert: avoid duplicate articles by URL
          const article = await prisma.newsArticle.upsert({
            where: { url: h.url },
            update: {},
            create: {
              title: h.title,
              url: h.url,
              source: h.source,
              publishedAt: new Date(h.publishedAt),
            },
          });
          // Link article to official (skip if already linked)
          await prisma.newsArticleOfficial.upsert({
            where: {
              articleId_officialId: {
                articleId: article.id,
                officialId: official.id,
              },
            },
            update: {},
            create: {
              articleId: article.id,
              officialId: official.id,
            },
          });
        } catch (err) {
          // Ignore unique constraint violations
          if (!err.message?.includes("Unique constraint")) {
            console.warn(`[Scraper] DB error: ${err.message}`);
          }
        }
      }
      successCount++;
    }

    if (typeof onProgress === "function") {
      onProgress({
        current: index + 1,
        total: officials.length,
        officialId: official.id,
        officialName: official.name,
        headlinesCount: headlines.length,
        updated,
        successCount,
      });
    }

    // Throttle: 2.5s between requests
    await new Promise((r) => setTimeout(r, 2500));
  }

  console.log(`[Scraper] Done — ${successCount}/${officials.length} officials updated.`);
  return {
    totalOfficials: officials.length,
    updatedOfficials: successCount,
  };
}

export async function scrapeOne(officialId, options = {}) {
  const { onProgress } = options;

  const official = await prisma.official.findUnique({
    where: { id: officialId },
    select: { id: true, name: true, level: true },
  });
  if (!official) {
    return {
      ok: false,
      officialId,
      reason: "OFFICIAL_NOT_FOUND",
      headlinesCount: 0,
    };
  }

  if (typeof onProgress === "function") {
    onProgress({
      current: 0,
      total: 1,
      officialId: official.id,
      officialName: official.name,
      headlinesCount: 0,
      updated: false,
    });
  }

  const headlines = await fetchNewsForOfficial(official);

  if (typeof onProgress === "function") {
    onProgress({
      current: 1,
      total: 1,
      officialId: official.id,
      officialName: official.name,
      headlinesCount: headlines.length,
      updated: headlines.length > 0,
    });
  }

  for (const h of headlines) {
    try {
      const article = await prisma.newsArticle.upsert({
        where: { url: h.url },
        update: {},
        create: {
          title: h.title,
          url: h.url,
          source: h.source,
          publishedAt: new Date(h.publishedAt),
        },
      });
      await prisma.newsArticleOfficial.upsert({
        where: {
          articleId_officialId: {
            articleId: article.id,
            officialId: official.id,
          },
        },
        update: {},
        create: { articleId: article.id, officialId: official.id },
      });
    } catch (err) {
      if (!err.message?.includes("Unique constraint")) {
        console.warn(`[Scraper] DB error: ${err.message}`);
      }
    }
  }

  return {
    ok: true,
    officialId: official.id,
    officialName: official.name,
    headlinesCount: headlines.length,
    updated: headlines.length > 0,
  };
}

export function startScraperDaemon() {
  // First run after 10s startup delay
  setTimeout(() => scrapeAll().catch(console.error), 10000);
  setInterval(() => scrapeAll().catch(console.error), SCRAPE_INTERVAL_MS);
  console.log(`[Scraper] Daemon started — runs every ${SCRAPE_INTERVAL_MS / 60000}min.`);
}
