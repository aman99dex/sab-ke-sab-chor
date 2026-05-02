// dailyAgent.js — Daily AI agent for Neta Watch
// Runs once per day at 2:00 AM IST (20:30 UTC prev day)
// Tasks:
//   1. Full news scrape for all officials
//   2. Re-verify pending claims with AI
//   3. Update official profiles from external intel
//   4. Log run history to DB

import cron from "node-cron";
import prisma from "./db.js";
import { verifyClaim } from "./aiVerifier.js";
import { getPersonProfile } from "./externalIntel.js";

let lastRunAt = null;
let lastRunStatus = null;
let runCount = 0;

async function runDailyRefresh(scrapeAll, label = "scheduled") {
  const startTime = Date.now();
  console.log(`\n[DailyAgent] ▶ Starting daily refresh (${label}) at ${new Date().toISOString()}`);

  const results = {
    newsUpdated: 0,
    claimsReverified: 0,
    profilesRefreshed: 0,
    errors: [],
  };

  // ── Task 1: Full news scrape ──────────────────────────────────────────────
  try {
    console.log("[DailyAgent] Task 1/3: Full news scrape...");
    const scrapeResult = await scrapeAll();
    results.newsUpdated = scrapeResult?.updated || 0;
    console.log(`[DailyAgent] News scrape done — ${results.newsUpdated} officials updated.`);
  } catch (err) {
    results.errors.push(`News scrape: ${err.message}`);
    console.error("[DailyAgent] News scrape failed:", err.message);
  }

  // ── Task 2: Re-verify pending claims ─────────────────────────────────────
  try {
    console.log("[DailyAgent] Task 2/3: Re-verifying pending claims...");
    const pendingClaims = await prisma.claim.findMany({
      where: { status: "PENDING" },
      include: { official: { select: { name: true } } },
      take: 30,
    });

    for (const claim of pendingClaims) {
      try {
        const result = await verifyClaim(claim.title, claim.description, claim.official?.name || "Unknown");
        if (result) {
          await prisma.claim.update({
            where: { id: claim.id },
            data: {
              aiVerificationNote: result.note,
              aiConfidence: result.confidence,
              status: result.verdict === "VERIFIED" ? "VERIFIED"
                : result.verdict === "LIKELY_FALSE" ? "REJECTED"
                : "PENDING",
              verifiedAt: result.verdict !== "UNVERIFIABLE" ? new Date() : undefined,
            },
          });
          results.claimsReverified++;
        }
      } catch (err) {
        results.errors.push(`Claim ${claim.id}: ${err.message}`);
      }
      // Rate limit: 400ms between AI calls
      await new Promise((r) => setTimeout(r, 400));
    }
    console.log(`[DailyAgent] Re-verified ${results.claimsReverified} claims.`);
  } catch (err) {
    results.errors.push(`Claim verification: ${err.message}`);
    console.error("[DailyAgent] Claim verification failed:", err.message);
  }

  // ── Task 3: Refresh official profiles from external intel ─────────────────
  try {
    console.log("[DailyAgent] Task 3/3: Refreshing official profiles...");
    const officials = await prisma.official.findMany({
      select: { id: true, name: true, websiteUrl: true },
      take: 10, // Limit to avoid quota exhaustion
      orderBy: { updatedAt: "asc" }, // Oldest first
    });

    for (const off of officials) {
      try {
        const profile = await getPersonProfile(off.name);
        if (profile && (profile.born || profile.description)) {
          await prisma.official.update({
            where: { id: off.id },
            data: {
              updatedAt: new Date(),
              // Only update websiteUrl if we found one and don't already have it
              ...(profile.website && !off.websiteUrl ? { websiteUrl: profile.website } : {}),
            },
          });
          results.profilesRefreshed++;
        }
      } catch (err) {
        results.errors.push(`Profile ${off.name}: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 600));
    }
    console.log(`[DailyAgent] Refreshed ${results.profilesRefreshed} profiles.`);
  } catch (err) {
    results.errors.push(`Profile refresh: ${err.message}`);
    console.error("[DailyAgent] Profile refresh failed:", err.message);
  }

  const durationMs = Date.now() - startTime;
  runCount++;
  lastRunAt = new Date().toISOString();
  lastRunStatus = {
    ...results,
    durationMs,
    label,
    runCount,
  };

  console.log(`[DailyAgent] ✅ Daily refresh complete in ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`[DailyAgent]   News: ${results.newsUpdated} | Claims: ${results.claimsReverified} | Profiles: ${results.profilesRefreshed} | Errors: ${results.errors.length}`);
  return lastRunStatus;
}

export function startDailyAgent(scrapeAll) {
  // Run at 20:30 UTC = 02:00 AM IST daily
  cron.schedule("30 20 * * *", () => {
    runDailyRefresh(scrapeAll, "midnight-IST").catch(console.error);
  }, { timezone: "UTC" });

  console.log("[DailyAgent] Scheduled — runs daily at 02:00 AM IST (20:30 UTC).");

  // Also expose a manual trigger
  return {
    triggerNow: (label = "manual") => runDailyRefresh(scrapeAll, label),
    getStatus: () => lastRunStatus,
    getLastRunAt: () => lastRunAt,
    getRunCount: () => runCount,
  };
}
