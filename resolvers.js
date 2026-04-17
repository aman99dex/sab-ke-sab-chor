import db from "./_db.js";
import { generateId, now, imageUrl } from "./helpers.js";

const resolveOfficial = (parent) =>
  db.officials.find((o) => o.id === parent.officialId);

export const resolvers = {
  Official: {
    profilePhoto: (parent) => imageUrl("profiles", parent.profilePhoto),
    promises: (parent) => db.promises.filter((p) => p.officialId === parent.id),
    allegations: (parent) => db.allegations.filter((a) => a.officialId === parent.id),
    claims: (parent) => db.claims.filter((c) => c.officialId === parent.id),
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
      parent.linkedPromiseId ? db.promises.find((p) => p.id === parent.linkedPromiseId) : null,
    linkedAllegation: (parent) =>
      parent.linkedAllegationId ? db.allegations.find((a) => a.id === parent.linkedAllegationId) : null,
  },

  Query: {
    officials: (_, { role, state }) => {
      let result = db.officials;
      if (role) result = result.filter((o) => o.role === role);
      if (state) result = result.filter((o) => o.state === state);
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
          o.state.toLowerCase().includes(q)
      );
    },
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

    submitClaim: (_, { input }) => {
      const claim = {
        ...input,
        id: generateId(),
        evidence: [],
        status: "PENDING",
        aiVerificationNote: null,
        linkedPromiseId: input.linkedPromiseId || null,
        linkedAllegationId: input.linkedAllegationId || null,
        createdAt: now(),
        verifiedAt: null,
      };
      db.claims.push(claim);
      return claim;
    },
    verifyClaim: (_, { id, input }) => {
      const idx = db.claims.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      db.claims[idx] = {
        ...db.claims[idx],
        status: input.status,
        aiVerificationNote: input.aiVerificationNote,
        verifiedAt: now(),
      };
      return db.claims[idx];
    },
    deleteClaim: (_, { id }) => {
      const len = db.claims.length;
      db.claims = db.claims.filter((c) => c.id !== id);
      return db.claims.length < len;
    },
  },
};
