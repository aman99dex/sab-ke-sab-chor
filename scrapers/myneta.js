// scrapers/myneta.js — MyNeta (ADR) Scraper
// Scrapes politician criminal records, assets, and education from myneta.info
// Data source: Association for Democratic Reforms (ADR)
//
// Usage: node scrapers/myneta.js
// Or imported and called from the job queue

import prisma from "../db.js";

const BASE_URL = "https://myneta.info";
const DELAY_MS = 3000; // 3s between requests to be respectful

// ─── Lok Sabha MPs List Page ───

export async function scrapeLokSabhaMPs() {
  console.log("[MyNeta] Scraping Lok Sabha MP list...");

  try {
    const res = await fetch(`${BASE_URL}/LokSabha/2024/`, {
      headers: {
        "User-Agent": "NetaWatch/3.0 (open-source political accountability research)",
        "Accept": "text/html",
      },
    });

    if (!res.ok) {
      console.error(`[MyNeta] HTTP ${res.status} fetching Lok Sabha page`);
      return [];
    }

    const html = await res.text();
    const mpList = parseMyNetaList(html, "NATIONAL", "LOK_SABHA");

    console.log(`[MyNeta] Found ${mpList.length} Lok Sabha MPs`);

    // Upsert each MP into database
    let saved = 0;
    for (const mp of mpList) {
      try {
        await prisma.official.upsert({
          where: {
            id: mp.sourceId || `myneta-ls-${mp.name.replace(/\s+/g, "-").toLowerCase()}`,
          },
          update: {
            assets: mp.totalAssets,
            criminalCases: mp.criminalCases,
            educationQualification: mp.education,
            sourceUrl: mp.sourceUrl,
          },
          create: {
            name: mp.name,
            role: "POLITICIAN",
            level: "NATIONAL",
            party: mp.party,
            position: "Member of Parliament (Lok Sabha)",
            constituency: mp.constituency,
            constituencyType: "LOK_SABHA",
            state: mp.state || "Unknown",
            assets: mp.totalAssets,
            criminalCases: mp.criminalCases,
            educationQualification: mp.education,
            sourceUrl: mp.sourceUrl,
          },
        });
        saved++;
      } catch (err) {
        console.warn(`[MyNeta] Error saving ${mp.name}: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 100)); // small delay for DB
    }

    console.log(`[MyNeta] Saved ${saved}/${mpList.length} Lok Sabha MPs to database`);
    return mpList;
  } catch (err) {
    console.error(`[MyNeta] Scrape error: ${err.message}`);
    return [];
  }
}

// ─── Scrape Individual MP Details ───

export async function scrapeMPDetails(mynetaUrl) {
  try {
    const res = await fetch(mynetaUrl, {
      headers: {
        "User-Agent": "NetaWatch/3.0 (open-source political accountability research)",
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    return parseMPDetailPage(html);
  } catch (err) {
    console.warn(`[MyNeta] Error fetching ${mynetaUrl}: ${err.message}`);
    return null;
  }
}

// ─── HTML Parsers ───

function parseMyNetaList(html, level, constituencyType) {
  const results = [];

  // MyNeta uses table rows with candidate data
  // Pattern: each row has name, constituency, party, criminal cases, education, assets
  const rowRegex = /<tr[^>]*>\s*<td[^>]*>.*?<a\s+href="([^"]*)"[^>]*>([^<]+)<\/a>.*?<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>/gi;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const [_, href, name, constituency, party, criminalCasesStr, educationStr, assetsStr] = match;

    results.push({
      name: decodeEntities(name).trim(),
      constituency: decodeEntities(constituency).trim(),
      party: decodeEntities(party).trim(),
      criminalCases: parseInt(criminalCasesStr) || 0,
      education: decodeEntities(educationStr).trim(),
      totalAssets: parseIndianNumber(assetsStr),
      sourceUrl: href.startsWith("http") ? href : `${BASE_URL}${href}`,
      level,
      constituencyType,
    });
  }

  // Fallback: if regex didn't match (HTML structure changed), try simpler extraction
  if (results.length === 0) {
    console.warn("[MyNeta] Primary parser found 0 results. HTML structure may have changed.");
    console.warn("[MyNeta] Try running the scraper manually and inspect the HTML.");
  }

  return results;
}

function parseMPDetailPage(html) {
  const details = {};

  // Extract criminal cases count
  const criminalMatch = html.match(/Criminal Cases?\s*:\s*(\d+)/i);
  if (criminalMatch) details.criminalCases = parseInt(criminalMatch[1]);

  // Extract total assets
  const assetMatch = html.match(/Total Assets?\s*[:\s~]*Rs\s*([0-9,.\s]+(?:Crore|Lac|Lakh)?)/i);
  if (assetMatch) details.totalAssets = parseIndianNumber(assetMatch[1]);

  // Extract liabilities
  const liabilityMatch = html.match(/Liabilities?\s*[:\s~]*Rs\s*([0-9,.\s]+(?:Crore|Lac|Lakh)?)/i);
  if (liabilityMatch) details.liabilities = parseIndianNumber(liabilityMatch[1]);

  // Extract education
  const eduMatch = html.match(/Education\s*:\s*([^<\n]+)/i);
  if (eduMatch) details.education = decodeEntities(eduMatch[1]).trim();

  // Extract age
  const ageMatch = html.match(/Age\s*:\s*(\d+)/i);
  if (ageMatch) details.age = parseInt(ageMatch[1]);

  return details;
}

// ─── Helpers ───

function parseIndianNumber(str) {
  if (!str) return null;
  const clean = str.replace(/[,\s]/g, "").toLowerCase();

  let multiplier = 1;
  if (clean.includes("crore")) multiplier = 10000000;
  else if (clean.includes("lac") || clean.includes("lakh")) multiplier = 100000;

  const numMatch = clean.match(/([0-9.]+)/);
  if (!numMatch) return null;

  return parseFloat(numMatch[1]) * multiplier;
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// ─── CLI Runner ───

if (process.argv[1]?.includes("myneta")) {
  console.log("🔍 Starting MyNeta Lok Sabha scraper...\n");
  const results = await scrapeLokSabhaMPs();
  console.log(`\n✅ Done. Found ${results.length} MPs.`);
  process.exit(0);
}
