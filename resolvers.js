// resolvers.js — Neta Watch GraphQL Resolvers (Prisma-backed)
// Replaces all in-memory array operations with PostgreSQL/SQLite via Prisma

import prisma from "./db.js";
import { scrapeAll, scrapeOne } from "./scraper.js";
import { verifyClaim as aiVerify } from "./aiVerifier.js";

// Helper: parse JSON string fields (proofImages, evidence, charges, sections)
const parseJsonArray = (str) => {
  if (!str) return [];
  try { return JSON.parse(str); } catch { return []; }
};

// Helper: build Prisma where clause from optional filters
const buildWhere = (filters) => {
  const where = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      where[key] = value;
    }
  }
  return where;
};

export const resolvers = {
  // ─── QUERIES ───
  Query: {
    // Officials
    officials: async (_, { role, state, level, party, limit = 50, offset = 0 }) => {
      return prisma.official.findMany({
        where: buildWhere({ role, state, level, party }),
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
      });
    },

    official: async (_, { id }) => {
      return prisma.official.findUnique({ where: { id } });
    },

    searchOfficials: async (_, { query }) => {
      return prisma.official.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { constituency: { contains: query } },
            { party: { contains: query } },
            { state: { contains: query } },
            { district: { contains: query } },
            { position: { contains: query } },
          ],
        },
        take: 20,
      });
    },

    // Promises
    promises: async (_, { officialId, status, limit = 50, offset = 0 }) => {
      return prisma.promise.findMany({
        where: buildWhere({ officialId, status }),
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });
    },

    promise: async (_, { id }) => {
      return prisma.promise.findUnique({ where: { id } });
    },

    // Allegations
    allegations: async (_, { officialId, status, severity, limit = 50, offset = 0 }) => {
      return prisma.allegation.findMany({
        where: buildWhere({ officialId, status, severity }),
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });
    },

    allegation: async (_, { id }) => {
      return prisma.allegation.findUnique({ where: { id } });
    },

    // Claims
    claims: async (_, { officialId, status, type, limit = 50, offset = 0 }) => {
      return prisma.claim.findMany({
        where: buildWhere({ officialId, status, type }),
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });
    },

    claim: async (_, { id }) => {
      return prisma.claim.findUnique({ where: { id } });
    },

    // Court Cases
    courtCases: async (_, { officialId, status, court, limit = 50, offset = 0 }) => {
      return prisma.courtCase.findMany({
        where: buildWhere({ officialId, status, court }),
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });
    },

    courtCase: async (_, { id }) => {
      return prisma.courtCase.findUnique({ where: { id } });
    },

    // FIRs
    firs: async (_, { officialId, state, limit = 50, offset = 0 }) => {
      return prisma.fIR.findMany({
        where: buildWhere({ officialId, state }),
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });
    },

    fir: async (_, { id }) => {
      return prisma.fIR.findUnique({ where: { id } });
    },

    // Asset Declarations
    assetDeclarations: async (_, { officialId, year }) => {
      return prisma.assetDeclaration.findMany({
        where: buildWhere({ officialId, year }),
        orderBy: { year: "desc" },
      });
    },

    // News
    newsArticles: async (_, { officialId, category, limit = 20, offset = 0 }) => {
      if (officialId) {
        const links = await prisma.newsArticleOfficial.findMany({
          where: { officialId },
          include: { article: true },
          take: limit,
          skip: offset,
          orderBy: { article: { publishedAt: "desc" } },
        });
        return links.map((l) => l.article);
      }
      return prisma.newsArticle.findMany({
        where: buildWhere({ category }),
        take: limit,
        skip: offset,
        orderBy: { publishedAt: "desc" },
      });
    },

    // RTI Responses
    rtiResponses: async (_, { officialId, department, limit = 50, offset = 0 }) => {
      return prisma.rTIResponse.findMany({
        where: buildWhere({ officialId, department }),
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });
    },

    // Whistleblower Reports
    whistleblowerReports: async (_, { status, category, limit = 50, offset = 0 }) => {
      return prisma.whistleblowerReport.findMany({
        where: buildWhere({ status, category }),
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });
    },

    // Scrape Jobs
    scrapeJobs: async (_, { source, status, limit = 20 }) => {
      return prisma.scrapeJob.findMany({
        where: buildWhere({ source, status }),
        take: limit,
        orderBy: { createdAt: "desc" },
      });
    },

    // Stats Summary
    statsSummary: async () => {
      const [
        totalOfficials, totalPoliticians, totalBureaucrats,
        totalPromises, completedPromises, pendingPromises,
        totalAllegations, highSeverityAllegations,
        totalClaims, pendingClaims, verifiedClaims,
        totalCourtCases, totalFIRs, totalNewsArticles,
        statesRaw,
      ] = await Promise.all([
        prisma.official.count(),
        prisma.official.count({ where: { role: "POLITICIAN" } }),
        prisma.official.count({ where: { role: { in: ["BUREAUCRAT", "IAS", "IPS"] } } }),
        prisma.promise.count(),
        prisma.promise.count({ where: { status: "COMPLETED" } }),
        prisma.promise.count({ where: { status: { in: ["NOT_STARTED", "IN_PROGRESS"] } } }),
        prisma.allegation.count(),
        prisma.allegation.count({ where: { severity: { in: ["HIGH", "CRITICAL"] } } }),
        prisma.claim.count(),
        prisma.claim.count({ where: { status: "PENDING" } }),
        prisma.claim.count({ where: { status: "VERIFIED" } }),
        prisma.courtCase.count(),
        prisma.fIR.count(),
        prisma.newsArticle.count(),
        prisma.official.findMany({ select: { state: true }, distinct: ["state"] }),
      ]);

      return {
        totalOfficials, totalPoliticians, totalBureaucrats,
        totalPromises, completedPromises, pendingPromises,
        totalAllegations, highSeverityAllegations,
        totalClaims, pendingClaims, verifiedClaims,
        totalCourtCases, totalFIRs, totalNewsArticles,
        statesTracked: statesRaw.length,
      };
    },
  },

  // ─── MUTATIONS ───
  Mutation: {
    // Officials
    addOfficial: async (_, { input }) => {
      return prisma.official.create({ data: input });
    },

    updateOfficial: async (_, { id, input }) => {
      // Remove undefined/null fields
      const data = {};
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) data[key] = value;
      }
      return prisma.official.update({ where: { id }, data });
    },

    deleteOfficial: async (_, { id }) => {
      await prisma.official.delete({ where: { id } });
      return true;
    },

    // Promises
    addPromise: async (_, { input }) => {
      return prisma.promise.create({ data: input });
    },

    updatePromise: async (_, { id, input }) => {
      const data = {};
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) data[key] = value;
      }
      return prisma.promise.update({ where: { id }, data });
    },

    deletePromise: async (_, { id }) => {
      await prisma.promise.delete({ where: { id } });
      return true;
    },

    // Allegations
    addAllegation: async (_, { input }) => {
      return prisma.allegation.create({ data: input });
    },

    updateAllegation: async (_, { id, input }) => {
      const data = {};
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) data[key] = value;
      }
      return prisma.allegation.update({ where: { id }, data });
    },

    deleteAllegation: async (_, { id }) => {
      await prisma.allegation.delete({ where: { id } });
      return true;
    },

    // Claims (anonymous submission + auto AI verification)
    submitClaim: async (_, { input }) => {
      const claim = await prisma.claim.create({
        data: {
          officialId: input.officialId,
          submittedBy: input.submittedBy || "Anonymous",
          type: input.type,
          title: input.title,
          description: input.description,
          linkedPromiseId: input.linkedPromiseId || null,
          linkedAllegationId: input.linkedAllegationId || null,
        },
      });

      // Auto-trigger AI verification in background (non-blocking)
      (async () => {
        try {
          const official = await prisma.official.findUnique({ where: { id: input.officialId } });
          const result = await aiVerify(input.title, input.description, official?.name || "Unknown");
          await prisma.claim.update({
            where: { id: claim.id },
            data: {
              status: result.claimStatus,
              aiVerificationNote: result.note,
              aiConfidence: result.confidence,
              aiModel: result.model,
              verifiedAt: new Date(),
            },
          });
          console.log(`[AI] Claim "${input.title}" auto-verified: ${result.label} (${result.confidence}%)`);
        } catch (err) {
          console.error("[AI] Auto-verify failed:", err.message);
        }
      })();

      return claim;
    },

    verifyClaim: async (_, { id, input }) => {
      return prisma.claim.update({
        where: { id },
        data: {
          status: input.status,
          aiVerificationNote: input.aiVerificationNote,
          aiConfidence: input.aiConfidence,
          aiModel: input.aiModel || null,
          verifiedAt: new Date(),
        },
      });
    },

    deleteClaim: async (_, { id }) => {
      await prisma.claim.delete({ where: { id } });
      return true;
    },

    // Court Cases
    addCourtCase: async (_, { input }) => {
      return prisma.courtCase.create({
        data: {
          officialId: input.officialId,
          caseNumber: input.caseNumber,
          court: input.court,
          caseType: input.caseType,
          status: input.status || "PENDING",
          charges: input.charges ? JSON.stringify(input.charges) : null,
          filingDate: input.filingDate || null,
          sourceUrl: input.sourceUrl || null,
          source: input.source || "MANUAL",
        },
      });
    },

    updateCourtCase: async (_, { id, input }) => {
      const data = {};
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) data[key] = value;
      }
      return prisma.courtCase.update({ where: { id }, data });
    },

    // FIRs
    addFIR: async (_, { input }) => {
      return prisma.fIR.create({
        data: {
          ...input,
          sections: JSON.stringify(input.sections),
          status: input.status || "REGISTERED",
        },
      });
    },

    // Asset Declarations
    addAssetDeclaration: async (_, { input }) => {
      return prisma.assetDeclaration.create({ data: input });
    },

    // Whistleblower Reports (anonymous)
    submitWhistleblowerReport: async (_, { input }) => {
      const report = await prisma.whistleblowerReport.create({
        data: {
          title: input.title,
          description: input.description,
          category: input.category,
          isAnonymous: input.isAnonymous !== false,
        },
      });
      // Link officials
      if (input.officialIds?.length > 0) {
        await prisma.whistleblowerReportOfficial.createMany({
          data: input.officialIds.map((officialId) => ({
            reportId: report.id,
            officialId,
          })),
        });
      }
      return report;
    },

    // RTI Responses (crowdsourced)
    submitRTIResponse: async (_, { input }) => {
      return prisma.rTIResponse.create({
        data: {
          officialId: input.officialId || null,
          department: input.department,
          question: input.question,
          response: input.response || null,
          filingDate: input.filingDate,
          responseDate: input.responseDate || null,
          status: input.status || "FILED",
          documentUrl: input.documentUrl || null,
          submittedBy: input.submittedBy || "Anonymous",
        },
      });
    },

    // Scraping trigger
    triggerScrape: async (_, { source, officialId }) => {
      const job = await prisma.scrapeJob.create({
        data: {
          source,
          targetId: officialId || null,
          status: "QUEUED",
        },
      });

      (async () => {
        try {
          await prisma.scrapeJob.update({
            where: { id: job.id },
            data: {
              status: "RUNNING",
              startedAt: new Date(),
            },
          });

          let result;
          if (source === "GNEWS") {
            result = officialId ? await scrapeOne(officialId) : await scrapeAll();
          } else {
            throw new Error(`Unsupported scrape source: ${source}`);
          }

          await prisma.scrapeJob.update({
            where: { id: job.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
              result: JSON.stringify(result || {}),
              error: null,
            },
          });
        } catch (error) {
          await prisma.scrapeJob.update({
            where: { id: job.id },
            data: {
              status: "FAILED",
              completedAt: new Date(),
              error: error?.message || "Scrape failed",
            },
          });
        }
      })().catch((error) => {
        console.error("[GraphQL triggerScrape] background failure", error);
      });

      return job;
    },
  },

  // ─── FIELD RESOLVERS ───
  Official: {
    promises: (parent) => prisma.promise.findMany({ where: { officialId: parent.id } }),
    allegations: (parent) => prisma.allegation.findMany({ where: { officialId: parent.id } }),
    claims: (parent) => prisma.claim.findMany({ where: { officialId: parent.id } }),
    courtCases: (parent) => prisma.courtCase.findMany({ where: { officialId: parent.id } }),
    firs: (parent) => prisma.fIR.findMany({ where: { officialId: parent.id } }),
    assetDeclarations: (parent) => prisma.assetDeclaration.findMany({ where: { officialId: parent.id }, orderBy: { year: "desc" } }),
    newsArticles: async (parent) => {
      const links = await prisma.newsArticleOfficial.findMany({
        where: { officialId: parent.id },
        include: { article: true },
        take: 10,
        orderBy: { article: { publishedAt: "desc" } },
      });
      return links.map((l) => l.article);
    },
    rtiResponses: (parent) => prisma.rTIResponse.findMany({ where: { officialId: parent.id } }),
    createdAt: (parent) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
    updatedAt: (parent) => parent.updatedAt instanceof Date ? parent.updatedAt.toISOString() : parent.updatedAt,
  },

  Promise: {
    official: (parent) => prisma.official.findUnique({ where: { id: parent.officialId } }),
    proofImages: (parent) => parseJsonArray(parent.proofImages),
    createdAt: (parent) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
    updatedAt: (parent) => parent.updatedAt instanceof Date ? parent.updatedAt.toISOString() : parent.updatedAt,
  },

  Allegation: {
    official: (parent) => prisma.official.findUnique({ where: { id: parent.officialId } }),
    proofImages: (parent) => parseJsonArray(parent.proofImages),
    createdAt: (parent) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
    updatedAt: (parent) => parent.updatedAt instanceof Date ? parent.updatedAt.toISOString() : parent.updatedAt,
  },

  Claim: {
    official: (parent) => prisma.official.findUnique({ where: { id: parent.officialId } }),
    evidence: (parent) => parseJsonArray(parent.evidence),
    linkedPromise: (parent) => parent.linkedPromiseId ? prisma.promise.findUnique({ where: { id: parent.linkedPromiseId } }) : null,
    linkedAllegation: (parent) => parent.linkedAllegationId ? prisma.allegation.findUnique({ where: { id: parent.linkedAllegationId } }) : null,
    createdAt: (parent) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
    verifiedAt: (parent) => parent.verifiedAt instanceof Date ? parent.verifiedAt.toISOString() : parent.verifiedAt,
  },

  CourtCase: {
    official: (parent) => prisma.official.findUnique({ where: { id: parent.officialId } }),
    charges: (parent) => parseJsonArray(parent.charges),
    createdAt: (parent) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
    updatedAt: (parent) => parent.updatedAt instanceof Date ? parent.updatedAt.toISOString() : parent.updatedAt,
  },

  FIR: {
    official: (parent) => prisma.official.findUnique({ where: { id: parent.officialId } }),
    sections: (parent) => parseJsonArray(parent.sections),
    createdAt: (parent) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
  },

  AssetDeclaration: {
    official: (parent) => prisma.official.findUnique({ where: { id: parent.officialId } }),
    createdAt: (parent) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
  },

  NewsArticle: {
    officials: async (parent) => {
      const links = await prisma.newsArticleOfficial.findMany({
        where: { articleId: parent.id },
        include: { official: true },
      });
      return links.map((l) => l.official);
    },
    publishedAt: (parent) => parent.publishedAt instanceof Date ? parent.publishedAt.toISOString() : parent.publishedAt,
  },

  RTIResponse: {
    official: (parent) => parent.officialId ? prisma.official.findUnique({ where: { id: parent.officialId } }) : null,
    createdAt: (parent) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
  },

  WhistleblowerReport: {
    officials: async (parent) => {
      const links = await prisma.whistleblowerReportOfficial.findMany({
        where: { reportId: parent.id },
        include: { official: true },
      });
      return links.map((l) => l.official);
    },
    evidence: (parent) => parseJsonArray(parent.evidence),
    createdAt: (parent) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
  },

  ScrapeJob: {
    createdAt: (parent) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
    startedAt: (parent) => parent.startedAt instanceof Date ? parent.startedAt.toISOString() : parent.startedAt,
    completedAt: (parent) => parent.completedAt instanceof Date ? parent.completedAt.toISOString() : parent.completedAt,
  },
};
