-- CreateTable
CREATE TABLE "Official" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "party" TEXT,
    "department" TEXT,
    "position" TEXT NOT NULL,
    "constituency" TEXT,
    "constituencyType" TEXT,
    "state" TEXT NOT NULL,
    "district" TEXT,
    "assets" REAL,
    "criminalCases" INTEGER NOT NULL DEFAULT 0,
    "educationQualification" TEXT,
    "websiteUrl" TEXT,
    "termStart" TEXT,
    "termEnd" TEXT,
    "profilePhoto" TEXT,
    "gender" TEXT,
    "age" INTEGER,
    "email" TEXT,
    "phone" TEXT,
    "sourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Promise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officialId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "budgetAllotted" REAL,
    "budgetSpent" REAL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "proofImages" TEXT,
    "sourceUrl" TEXT,
    "deadline" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Promise_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Allegation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officialId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "proofImages" TEXT,
    "sourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Allegation_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officialId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL DEFAULT 'Anonymous',
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "aiVerificationNote" TEXT,
    "aiConfidence" INTEGER,
    "aiModel" TEXT,
    "linkedPromiseId" TEXT,
    "linkedAllegationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" DATETIME,
    CONSTRAINT "Claim_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Claim_linkedPromiseId_fkey" FOREIGN KEY ("linkedPromiseId") REFERENCES "Promise" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Claim_linkedAllegationId_fkey" FOREIGN KEY ("linkedAllegationId") REFERENCES "Allegation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourtCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officialId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "court" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "charges" TEXT,
    "filingDate" TEXT,
    "lastHearingDate" TEXT,
    "nextHearingDate" TEXT,
    "judgment" TEXT,
    "judgmentSummary" TEXT,
    "sourceUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CourtCase_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FIR" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officialId" TEXT NOT NULL,
    "firNumber" TEXT NOT NULL,
    "policeStation" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "sections" TEXT NOT NULL,
    "filingDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "description" TEXT,
    "sourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FIR_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssetDeclaration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officialId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "electionType" TEXT,
    "movableAssets" REAL,
    "immovableAssets" REAL,
    "totalAssets" REAL,
    "liabilities" REAL,
    "spouseAssets" REAL,
    "sourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetDeclaration_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "sentiment" TEXT,
    "category" TEXT,
    "content" TEXT,
    "aiVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NewsArticleOfficial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "officialId" TEXT NOT NULL,
    CONSTRAINT "NewsArticleOfficial_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "NewsArticle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NewsArticleOfficial_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RTIResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "officialId" TEXT,
    "department" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "response" TEXT,
    "filingDate" TEXT NOT NULL,
    "responseDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'FILED',
    "documentUrl" TEXT,
    "submittedBy" TEXT NOT NULL DEFAULT 'Anonymous',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RTIResponse_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WhistleblowerReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "submitterContact" TEXT,
    "aiVerificationNote" TEXT,
    "aiConfidence" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WhistleblowerReportOfficial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "officialId" TEXT NOT NULL,
    CONSTRAINT "WhistleblowerReportOfficial_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "WhistleblowerReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WhistleblowerReportOfficial_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScrapeJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "targetId" TEXT,
    "result" TEXT,
    "error" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Official_role_idx" ON "Official"("role");

-- CreateIndex
CREATE INDEX "Official_level_idx" ON "Official"("level");

-- CreateIndex
CREATE INDEX "Official_state_idx" ON "Official"("state");

-- CreateIndex
CREATE INDEX "Official_party_idx" ON "Official"("party");

-- CreateIndex
CREATE INDEX "Official_name_idx" ON "Official"("name");

-- CreateIndex
CREATE INDEX "Promise_officialId_idx" ON "Promise"("officialId");

-- CreateIndex
CREATE INDEX "Promise_status_idx" ON "Promise"("status");

-- CreateIndex
CREATE INDEX "Allegation_officialId_idx" ON "Allegation"("officialId");

-- CreateIndex
CREATE INDEX "Allegation_severity_idx" ON "Allegation"("severity");

-- CreateIndex
CREATE INDEX "Allegation_status_idx" ON "Allegation"("status");

-- CreateIndex
CREATE INDEX "Claim_officialId_idx" ON "Claim"("officialId");

-- CreateIndex
CREATE INDEX "Claim_status_idx" ON "Claim"("status");

-- CreateIndex
CREATE INDEX "Claim_type_idx" ON "Claim"("type");

-- CreateIndex
CREATE INDEX "CourtCase_officialId_idx" ON "CourtCase"("officialId");

-- CreateIndex
CREATE INDEX "CourtCase_status_idx" ON "CourtCase"("status");

-- CreateIndex
CREATE INDEX "CourtCase_court_idx" ON "CourtCase"("court");

-- CreateIndex
CREATE UNIQUE INDEX "CourtCase_caseNumber_court_key" ON "CourtCase"("caseNumber", "court");

-- CreateIndex
CREATE INDEX "FIR_officialId_idx" ON "FIR"("officialId");

-- CreateIndex
CREATE INDEX "FIR_state_idx" ON "FIR"("state");

-- CreateIndex
CREATE INDEX "AssetDeclaration_officialId_idx" ON "AssetDeclaration"("officialId");

-- CreateIndex
CREATE INDEX "AssetDeclaration_year_idx" ON "AssetDeclaration"("year");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDeclaration_officialId_year_electionType_key" ON "AssetDeclaration"("officialId", "year", "electionType");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_url_key" ON "NewsArticle"("url");

-- CreateIndex
CREATE INDEX "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "NewsArticle_source_idx" ON "NewsArticle"("source");

-- CreateIndex
CREATE INDEX "NewsArticle_category_idx" ON "NewsArticle"("category");

-- CreateIndex
CREATE INDEX "NewsArticleOfficial_officialId_idx" ON "NewsArticleOfficial"("officialId");

-- CreateIndex
CREATE INDEX "NewsArticleOfficial_articleId_idx" ON "NewsArticleOfficial"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticleOfficial_articleId_officialId_key" ON "NewsArticleOfficial"("articleId", "officialId");

-- CreateIndex
CREATE INDEX "RTIResponse_officialId_idx" ON "RTIResponse"("officialId");

-- CreateIndex
CREATE INDEX "RTIResponse_department_idx" ON "RTIResponse"("department");

-- CreateIndex
CREATE INDEX "WhistleblowerReport_category_idx" ON "WhistleblowerReport"("category");

-- CreateIndex
CREATE INDEX "WhistleblowerReport_status_idx" ON "WhistleblowerReport"("status");

-- CreateIndex
CREATE INDEX "WhistleblowerReportOfficial_officialId_idx" ON "WhistleblowerReportOfficial"("officialId");

-- CreateIndex
CREATE INDEX "WhistleblowerReportOfficial_reportId_idx" ON "WhistleblowerReportOfficial"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "WhistleblowerReportOfficial_reportId_officialId_key" ON "WhistleblowerReportOfficial"("reportId", "officialId");

-- CreateIndex
CREATE INDEX "ScrapeJob_source_idx" ON "ScrapeJob"("source");

-- CreateIndex
CREATE INDEX "ScrapeJob_status_idx" ON "ScrapeJob"("status");
