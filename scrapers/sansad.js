// scrapers/sansad.js — Parliament of India (sansad.in) Scraper
// Scrapes MP profiles from Lok Sabha and Rajya Sabha websites
//
// Sources:
//   - sansad.in/ls (Lok Sabha)
//   - sansad.in/rs (Rajya Sabha)

import prisma from "../db.js";

const LOK_SABHA_URL = "https://sansad.in/ls";
const RAJYA_SABHA_URL = "https://sansad.in/rs";
const DELAY_MS = 2000;

// ─── Scrape Lok Sabha Members ───

export async function scrapeLokSabhaMembers() {
  console.log("[Sansad] Scraping Lok Sabha member list...");

  try {
    // The main members page
    const res = await fetch(`${LOK_SABHA_URL}/members`, {
      headers: {
        "User-Agent": "NetaWatch/3.0 (open-source political accountability research)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      console.error(`[Sansad] HTTP ${res.status} fetching LS members page`);
      return [];
    }

    const html = await res.text();
    const members = parseSansadMemberList(html, "LOK_SABHA");

    console.log(`[Sansad] Found ${members.length} Lok Sabha members`);

    let saved = 0;
    for (const mp of members) {
      try {
        // Try to find existing official by name + constituency
        const existing = await prisma.official.findFirst({
          where: {
            name: { contains: mp.name },
            level: "NATIONAL",
          },
        });

        if (existing) {
          // Update with Sansad data
          await prisma.official.update({
            where: { id: existing.id },
            data: {
              constituency: mp.constituency || existing.constituency,
              state: mp.state || existing.state,
              party: mp.party || existing.party,
            },
          });
        } else {
          // Create new
          await prisma.official.create({
            data: {
              name: mp.name,
              role: "POLITICIAN",
              level: "NATIONAL",
              party: mp.party || "Independent",
              position: "Member of Parliament (Lok Sabha)",
              constituency: mp.constituency || "Unknown",
              constituencyType: "LOK_SABHA",
              state: mp.state || "Unknown",
              sourceUrl: mp.profileUrl,
            },
          });
        }
        saved++;
      } catch (err) {
        console.warn(`[Sansad] Error saving ${mp.name}: ${err.message}`);
      }
    }

    console.log(`[Sansad] Saved/updated ${saved} Lok Sabha members`);
    return members;
  } catch (err) {
    console.error(`[Sansad] Error: ${err.message}`);
    return [];
  }
}

// ─── Scrape Rajya Sabha Members ───

export async function scrapeRajyaSabhaMembers() {
  console.log("[Sansad] Scraping Rajya Sabha member list...");

  try {
    const res = await fetch(`${RAJYA_SABHA_URL}/members`, {
      headers: {
        "User-Agent": "NetaWatch/3.0 (open-source political accountability research)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      console.error(`[Sansad] HTTP ${res.status} fetching RS members page`);
      return [];
    }

    const html = await res.text();
    const members = parseSansadMemberList(html, "RAJYA_SABHA");

    console.log(`[Sansad] Found ${members.length} Rajya Sabha members`);

    let saved = 0;
    for (const mp of members) {
      try {
        const existing = await prisma.official.findFirst({
          where: {
            name: { contains: mp.name },
            level: "NATIONAL",
            constituencyType: "RAJYA_SABHA",
          },
        });

        if (existing) {
          await prisma.official.update({
            where: { id: existing.id },
            data: {
              state: mp.state || existing.state,
              party: mp.party || existing.party,
            },
          });
        } else {
          await prisma.official.create({
            data: {
              name: mp.name,
              role: "POLITICIAN",
              level: "NATIONAL",
              party: mp.party || "Independent",
              position: "Member of Parliament (Rajya Sabha)",
              constituency: mp.state || "Unknown",
              constituencyType: "RAJYA_SABHA",
              state: mp.state || "Unknown",
              sourceUrl: mp.profileUrl,
            },
          });
        }
        saved++;
      } catch (err) {
        console.warn(`[Sansad] Error saving ${mp.name}: ${err.message}`);
      }
    }

    console.log(`[Sansad] Saved/updated ${saved} Rajya Sabha members`);
    return members;
  } catch (err) {
    console.error(`[Sansad] Error: ${err.message}`);
    return [];
  }
}

// ─── HTML Parser ───

function parseSansadMemberList(html, house) {
  const members = [];

  // Sansad.in uses various HTML structures. Try multiple patterns.

  // Pattern 1: Table rows with member data
  const tableRowRegex = /<tr[^>]*>\s*<td[^>]*>.*?<a\s+href="([^"]*)"[^>]*>\s*([^<]+)\s*<\/a>.*?<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/gi;

  let match;
  while ((match = tableRowRegex.exec(html)) !== null) {
    const [_, href, name, col2, col3] = match;
    members.push({
      name: cleanText(name),
      constituency: house === "LOK_SABHA" ? cleanText(col2) : null,
      party: cleanText(col3),
      state: house === "RAJYA_SABHA" ? cleanText(col2) : extractState(html, name),
      profileUrl: href.startsWith("http") ? href : `https://sansad.in${href}`,
      house,
    });
  }

  // Pattern 2: Card-based layout (newer sansad.in redesign)
  if (members.length === 0) {
    const cardRegex = /<div[^>]*class="[^"]*member[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<h\d[^>]*>([^<]+)<\/h\d>[\s\S]*?<p[^>]*>([^<]*)<\/p>[\s\S]*?<p[^>]*>([^<]*)<\/p>/gi;

    while ((match = cardRegex.exec(html)) !== null) {
      const [_, href, name, detail1, detail2] = match;
      members.push({
        name: cleanText(name),
        constituency: house === "LOK_SABHA" ? cleanText(detail1) : null,
        party: cleanText(detail2),
        state: house === "RAJYA_SABHA" ? cleanText(detail1) : null,
        profileUrl: href.startsWith("http") ? href : `https://sansad.in${href}`,
        house,
      });
    }
  }

  if (members.length === 0) {
    console.warn(`[Sansad] Parser found 0 members. HTML structure may have changed.`);
    console.warn(`[Sansad] This page likely needs Playwright for JavaScript rendering.`);
    console.warn(`[Sansad] Consider using: npx playwright install && node scrapers/sansadPlaywright.js`);
  }

  return members;
}

function cleanText(str) {
  return str?.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() || "";
}

function extractState(html, name) {
  // Try to find state near the member name in the HTML
  const idx = html.indexOf(name);
  if (idx === -1) return null;
  const nearby = html.substring(idx, idx + 500);
  const stateMatch = nearby.match(/(?:State|Pradesh|Kerala|Tamil Nadu|Maharashtra|Karnataka|Gujarat|Rajasthan|Bihar|West Bengal|Uttar Pradesh|Madhya Pradesh|Andhra Pradesh|Telangana|Odisha|Punjab|Haryana|Assam|Jharkhand|Chhattisgarh|Uttarakhand|Goa|Tripura|Meghalaya|Manipur|Nagaland|Mizoram|Arunachal Pradesh|Sikkim|Himachal Pradesh|Delhi|Jammu & Kashmir|Ladakh|Puducherry|Chandigarh|Lakshadweep|Dadra|Daman|Andaman)/i);
  return stateMatch ? stateMatch[0] : null;
}

// ─── CLI Runner ───

if (process.argv[1]?.includes("sansad")) {
  console.log("🏛️  Starting Sansad.in Parliament scraper...\n");
  await scrapeLokSabhaMembers();
  await new Promise((r) => setTimeout(r, DELAY_MS));
  await scrapeRajyaSabhaMembers();
  console.log("\n✅ Done.");
  process.exit(0);
}
