// scrapers/indianKanoon.js — Indian Kanoon Court Cases API Client
// API Docs: https://api.indiankanoon.org
// Free: ₹500 trial credits, ₹10,000/month for non-commercial
//
// Pricing: ₹0.50/search, ₹0.20/doc, ₹0.02/meta

import prisma from "../db.js";

const API_BASE = "https://api.indiankanoon.org";
const TOKEN = process.env.INDIAN_KANOON_TOKEN || null;

// ─── Search for court cases mentioning an official ───

export async function searchCases(officialName, pageNum = 0) {
  if (!TOKEN) {
    console.warn("[IndianKanoon] No API token set. Set INDIAN_KANOON_TOKEN in .env");
    return [];
  }

  const query = `"${officialName}" criminal OR corruption OR fraud OR FIR OR chargesheet`;

  try {
    const res = await fetch(`${API_BASE}/search/`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `formInput=${encodeURIComponent(query)}&pagenum=${pageNum}`,
    });

    if (!res.ok) {
      console.warn(`[IndianKanoon] HTTP ${res.status}: ${await res.text()}`);
      return [];
    }

    const data = await res.json();
    return data.docs || [];
  } catch (err) {
    console.error(`[IndianKanoon] Search error: ${err.message}`);
    return [];
  }
}

// ─── Get document details ───

export async function getDocument(docId) {
  if (!TOKEN) return null;

  try {
    const res = await fetch(`${API_BASE}/doc/${docId}/`, {
      headers: { "Authorization": `Token ${TOKEN}` },
    });

    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error(`[IndianKanoon] Doc error: ${err.message}`);
    return null;
  }
}

// ─── Get document metadata (cheapest: ₹0.02) ───

export async function getDocMeta(docId) {
  if (!TOKEN) return null;

  try {
    const res = await fetch(`${API_BASE}/docmeta/${docId}/`, {
      headers: { "Authorization": `Token ${TOKEN}` },
    });

    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error(`[IndianKanoon] Meta error: ${err.message}`);
    return null;
  }
}

// ─── Scrape court cases for a specific official and save to DB ───

export async function scrapeCourtCasesForOfficial(officialId) {
  const official = await prisma.official.findUnique({
    where: { id: officialId },
    select: { id: true, name: true },
  });

  if (!official) {
    console.warn(`[IndianKanoon] Official ${officialId} not found`);
    return 0;
  }

  console.log(`[IndianKanoon] Searching cases for "${official.name}"...`);

  const docs = await searchCases(official.name);
  let saved = 0;

  for (const doc of docs) {
    try {
      // Get metadata for more details (cheapest API call)
      const meta = await getDocMeta(doc.tid);
      await new Promise((r) => setTimeout(r, 500)); // rate limit

      const caseNumber = meta?.citation || doc.title?.match(/\b\d{4}\s*\/\s*\d+\b/)?.[0] || `IK-${doc.tid}`;
      const court = meta?.bench || extractCourtName(doc.title) || "Unknown Court";

      await prisma.courtCase.upsert({
        where: {
          caseNumber_court: { caseNumber, court },
        },
        update: {
          sourceUrl: `https://indiankanoon.org/doc/${doc.tid}/`,
          judgmentSummary: doc.headline?.substring(0, 500),
        },
        create: {
          officialId: official.id,
          caseNumber,
          court,
          caseType: guessCaseType(doc.title + " " + (doc.headline || "")),
          status: guessCaseStatus(doc.headline || ""),
          sourceUrl: `https://indiankanoon.org/doc/${doc.tid}/`,
          judgmentSummary: doc.headline?.substring(0, 500),
          source: "INDIAN_KANOON",
        },
      });
      saved++;
    } catch (err) {
      if (!err.message?.includes("Unique constraint")) {
        console.warn(`[IndianKanoon] DB error: ${err.message}`);
      }
    }
  }

  console.log(`[IndianKanoon] Saved ${saved} court cases for "${official.name}"`);
  return saved;
}

// ─── Helpers ───

function extractCourtName(title) {
  if (!title) return null;
  const t = title.toLowerCase();
  if (t.includes("supreme court")) return "Supreme Court of India";
  if (t.includes("high court")) {
    const match = title.match(/([\w\s]+High Court)/i);
    return match ? match[1] : "High Court";
  }
  if (t.includes("district court")) return "District Court";
  if (t.includes("sessions court")) return "Sessions Court";
  if (t.includes("tribunal")) return "Tribunal";
  return null;
}

function guessCaseType(text) {
  const t = text.toLowerCase();
  if (t.includes("criminal") || t.includes("fir") || t.includes("ipc")) return "CRIMINAL";
  if (t.includes("pil") || t.includes("public interest")) return "PIL";
  if (t.includes("writ")) return "WRIT";
  if (t.includes("appeal")) return "APPEAL";
  if (t.includes("civil")) return "CIVIL";
  return "CRIMINAL"; // default for politician cases
}

function guessCaseStatus(text) {
  const t = text.toLowerCase();
  if (t.includes("convicted") || t.includes("guilty")) return "CONVICTED";
  if (t.includes("acquitted") || t.includes("not guilty")) return "ACQUITTED";
  if (t.includes("discharged")) return "DISCHARGED";
  if (t.includes("appeal")) return "APPEALED";
  if (t.includes("pending") || t.includes("next date")) return "HEARING";
  return "PENDING";
}

// ─── CLI Runner ───

if (process.argv[1]?.includes("indianKanoon")) {
  if (!TOKEN) {
    console.error("❌ Set INDIAN_KANOON_TOKEN in .env first!");
    console.log("\nHow to get your token:");
    console.log("1. Go to https://api.indiankanoon.org");
    console.log("2. Create an account");
    console.log("3. Get ₹500 free trial credits");
    console.log("4. For ₹10,000/mo free: email admin@indiankanoon.org about your non-commercial project");
    console.log("5. Copy your API token to .env: INDIAN_KANOON_TOKEN=your_token_here");
    process.exit(1);
  }

  const officialId = process.argv[2];
  if (officialId) {
    await scrapeCourtCasesForOfficial(officialId);
  } else {
    console.log("Usage: node scrapers/indianKanoon.js <officialId>");
    console.log("Or import and use scrapeCourtCasesForOfficial() in your code.");
  }
  process.exit(0);
}
