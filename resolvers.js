import db, { newsCache } from "./_db.js";
import { generateId, now, imageUrl } from "./helpers.js";
import { verifyClaim as aiVerifyClaim } from "./aiVerifier.js";
import { scrapeOne } from "./scraper.js";

const resolveOfficial = (parent) =>
  db.officials.find((o) => o.id === parent.officialId);

export const resolvers = {
  Official: {
    profilePhoto: (parent) => imageUrl("profiles", parent.profilePhoto),
    promises: (parent) => db.promises.filter((p) => p.officialId === parent.id),
    allegations: (parent) => db.allegations.filter((a) => a.officialId === parent.id),
    claims: (parent) => db.claims.filter((c) => c.officialId === parent.id),
    newsHeadlines: (parent) => newsCache.get(parent.id) || [],
  },

  Promise: {
    official: resolveOfficial,
    proofImages: (parent) => parent.proofImages.map((f) => imageUrl("promises", f)),
  },

  Allegation: {
    official: resolveOfficial,
    proofImages: (parent) => parent.proofImages.map((f) => imageUrl("allegations", f)),
  },

  Claim: {
    official: resolveOfficial,
    evidence: (parent) => parent.evidence.map((f) => imageUrl("claims", f)),
    linkedPromise: (parent) =>
      parent.linkedPromiseId
        ? db.promises.find((p) => p.id === parent.linkedPromiseId)
        : null,
    linkedAllegation: (parent) =>
      parent.linkedAllegationId
        ? db.allegations.find((a) => a.id === parent.linkedAllegationId)
        : null,
  },

  Query: {
    officials: (_, { role, state, level, party }) => {
      let result = db.officials;
      if (role) result = result.filter((o) => o.role === role);
      if (state) result = result.filter((o) => o.state === state);
      if (level) result = result.filter((o) => o.level === level);
      if (party) result = result.filter((o) => o.party && o.party.toLowerCase().includes(party.toLowerCase()));
      return result;
    },
    official: (_, { id }) => db.officials.find((o) => o.id === id),

    promises: (_, { officialId, status }) => {
      let result = db.promises;
      if (officialId) result = result.filter((p) => p.officialId === officialId);
      if (status) result = result.filter((p) => p.status === status);
      return result;
    },
    promise: (_, { id }) => db.promises.find((p) => p.id === id),

    allegations: (_, { officialId, status }) => {
      let result = db.allegations;
      if (officialId) result = result.filter((a) => a.officialId === officialId);
      if (status) result = result.filter((a) => a.status === status);
      return result;
    },
    allegation: (_, { id }) => db.allegations.find((a) => a.id === id),

    claims: (_, { officialId, status }) => {
      let result = db.claims;
      if (officialId) result = result.filter((c) => c.officialId === officialId);
      if (status) result = result.filter((c) => c.status === status);
      return result;
    },
    claim: (_, { id }) => db.claims.find((c) => c.id === id),

    searchOfficials: (_, { query }) => {
      const q = query.toLowerCase();
      return db.officials.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.position.toLowerCase().includes(q) ||
          (o.party && o.party.toLowerCase().includes(q)) ||
          o.state.toLowerCase().includes(q) ||
          (o.constituency && o.constituency.toLowerCase().includes(q)) ||
          (o.district && o.district.toLowerCase().includes(q))
      );
    },

    statsSummary: () => {
      const officials = db.officials;
      const promises = db.promises;
      const allegations = db.allegations;
      const claims = db.claims;
      const states = new Set(officials.map((o) => o.state));

      return {
        totalOfficials: officials.length,
        totalPoliticians: officials.filter((o) => o.role === "POLITICIAN").length,
        totalBureaucrats: officials.filter((o) => o.role === "BUREAUCRAT").length,
        totalPromises: promises.length,
        completedPromises: promises.filter((p) => p.status === "COMPLETED").length,
        pendingPromises: promises.filter((p) => p.status !== "COMPLETED" && p.status !== "FAILED").length,
        totalAllegations: allegations.length,
        highSeverityAllegations: allegations.filter((a) => a.severity === "HIGH").length,
        totalClaims: claims.length,
        pendingClaims: claims.filter((c) => c.status === "PENDING").length,
        verifiedClaims: claims.filter((c) => c.status === "VERIFIED").length,
        statesTracked: states.size,
      };
    },

    newsHeadlines: (_, { officialId }) => newsCache.get(officialId) || [],
  },

  Mutation: {
    addOfficial: (_, { input }) => {
      const official = {
        ...input,
        id: generateId(),
        profilePhoto: null,
        createdAt: now(),
      };
      db.officials.push(official);
      return official;
    },
    updateOfficial: (_, { id, input }) => {
      const idx = db.officials.findIndex((o) => o.id === id);
      if (idx === -1) return null;
      db.officials[idx] = { ...db.officials[idx], ...input };
      return db.officials[idx];
    },
    deleteOfficial: (_, { id }) => {
      const len = db.officials.length;
      db.officials = db.officials.filter((o) => o.id !== id);
      return db.officials.length < len;
    },

    addPromise: (_, { input }) => {
      const timestamp = now();
      const promise = {
        ...input,
        id: generateId(),
        budgetSpent: 0,
        status: input.status || "NOT_STARTED",
        proofImages: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db.promises.push(promise);
      return promise;
    },
    updatePromise: (_, { id, input }) => {
      const idx = db.promises.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      db.promises[idx] = { ...db.promises[idx], ...input, updatedAt: now() };
      return db.promises[idx];
    },
    deletePromise: (_, { id }) => {
      const len = db.promises.length;
      db.promises = db.promises.filter((p) => p.id !== id);
      return db.promises.length < len;
    },

    addAllegation: (_, { input }) => {
      const timestamp = now();
      const allegation = {
        ...input,
        id: generateId(),
        status: "UNVERIFIED",
        proofImages: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db.allegations.push(allegation);
      return allegation;
    },
    updateAllegation: (_, { id, input }) => {
      const idx = db.allegations.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      db.allegations[idx] = { ...db.allegations[idx], ...input, updatedAt: now() };
      return db.allegations[idx];
    },
    deleteAllegation: (_, { id }) => {
      const len = db.allegations.length;
      db.allegations = db.allegations.filter((a) => a.id !== id);
      return db.allegations.length < len;
    },

    submitClaim: async (_, { input }) => {
      const claim = {
        ...input,
        id: generateId(),
        evidence: [],
        status: "PENDING",
        aiVerificationNote: null,
        aiConfidence: null,
        linkedPromiseId: input.linkedPromiseId || null,
        linkedAllegationId: input.linkedAllegationId || null,
        createdAt: now(),
        verifiedAt: null,
      };
      db.claims.push(claim);

      // Fire-and-forget AI verification in background
      const official = db.officials.find((o) => o.id === input.officialId);
      if (official) {
        (async () => {
          try {
            const result = await aiVerifyClaim(input.title, input.description, official.name);
            const idx = db.claims.findIndex((c) => c.id === claim.id);
            if (idx !== -1) {
              db.claims[idx].aiVerificationNote = result.note;
              db.claims[idx].aiConfidence = result.confidence;
              if (result.claimStatus === "VERIFIED") {
                db.claims[idx].status = "VERIFIED";
                db.claims[idx].verifiedAt = now();
              }
              console.log(`[AI Verifier] Claim ${claim.id}: ${result.label} (${result.confidence}% confidence)`);
            }
          } catch (err) {
            console.warn("[AI Verifier] Background verification failed:", err.message);
          }
        })();
      }

      return claim;
    },

    verifyClaim: async (_, { id, input }) => {
      const idx = db.claims.findIndex((c) => c.id === id);
      if (idx === -1) return null;

      // If no note provided, run AI verification
      let note = input.aiVerificationNote;
      let confidence = input.aiConfidence ?? null;

      if (!note || note === "auto") {
        const claim = db.claims[idx];
        const official = db.officials.find((o) => o.id === claim.officialId);
        if (official) {
          try {
            const result = await aiVerifyClaim(claim.title, claim.description, official.name);
            note = result.note;
            confidence = result.confidence;
          } catch (err) {
            note = "AI verification failed — manual review required.";
          }
        }
      }

      db.claims[idx] = {
        ...db.claims[idx],
        status: input.status,
        aiVerificationNote: note,
        aiConfidence: confidence,
        verifiedAt: now(),
      };
      return db.claims[idx];
    },

    deleteClaim: (_, { id }) => {
      const len = db.claims.length;
      db.claims = db.claims.filter((c) => c.id !== id);
      return db.claims.length < len;
    },

    triggerScrape: async (_, { officialId }) => {
      try {
        if (officialId) {
          return await scrapeOne(officialId);
        }
        const { scrapeAll } = await import("./scraper.js");
        scrapeAll().catch(console.error); // fire-and-forget
        return true;
      } catch (err) {
        console.error("[Scraper] Manual trigger failed:", err.message);
        return false;
      }
    },
  },
};
