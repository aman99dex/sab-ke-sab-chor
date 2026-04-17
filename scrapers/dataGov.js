// scrapers/dataGov.js — data.gov.in Open Government Data API Client
// Register for API key at: https://data.gov.in → My Account → Generate API Key
//
// Provides access to government datasets including:
// - Election results
// - Budget data
// - NCRB crime statistics
// - Scheme performance data

import prisma from "../db.js";

const API_BASE = "https://api.data.gov.in/resource";
const API_KEY = process.env.DATA_GOV_API_KEY || null;

// ─── Fetch Dataset from data.gov.in ───

export async function fetchDataset(resourceId, { format = "json", limit = 100, offset = 0, filters = {} } = {}) {
  if (!API_KEY) {
    console.warn("[DataGov] No API key set. Register at https://data.gov.in and set DATA_GOV_API_KEY in .env");
    return null;
  }

  const params = new URLSearchParams({
    "api-key": API_KEY,
    format,
    limit: String(limit),
    offset: String(offset),
    ...filters,
  });

  const url = `${API_BASE}/${resourceId}?${params}`;

  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      console.warn(`[DataGov] HTTP ${res.status}: ${await res.text()}`);
      return null;
    }

    return res.json();
  } catch (err) {
    console.error(`[DataGov] Error: ${err.message}`);
    return null;
  }
}

// ─── Known Resource IDs for Useful Datasets ───

// These are example resource IDs — you'll need to find the current ones
// by searching on data.gov.in for specific datasets
export const KNOWN_DATASETS = {
  // Search data.gov.in for these and replace with actual resource IDs
  ELECTION_RESULTS: null, // Lok Sabha election results
  BUDGET_EXPENDITURE: null, // Central government budget
  CRIME_STATISTICS: null, // NCRB crime data
  SCHEME_PERFORMANCE: null, // Government scheme performance
};

// ─── How to find Resource IDs ───
// 1. Go to https://data.gov.in
// 2. Search for the dataset you want (e.g., "Lok Sabha election results")
// 3. Click on the dataset
// 4. The resource ID is in the API section (a long alphanumeric string)
// 5. Add it to KNOWN_DATASETS above

// ─── CLI Runner ───

if (process.argv[1]?.includes("dataGov")) {
  if (!API_KEY) {
    console.error("❌ Set DATA_GOV_API_KEY in .env first!");
    console.log("\nHow to get your API key:");
    console.log("1. Go to https://data.gov.in");
    console.log("2. Create an account (free)");
    console.log("3. Go to My Account → API Key section");
    console.log("4. Generate a new 32-character API key");
    console.log("5. Add to .env: DATA_GOV_API_KEY=your_key_here");
    process.exit(1);
  }

  // Test with a sample query
  console.log("✅ data.gov.in API client ready. Use fetchDataset() with a resource ID.");
  process.exit(0);
}
