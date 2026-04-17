// schema.js — Neta Watch GraphQL Schema (Expanded)
// Covers: Officials, Promises, Allegations, Claims, Court Cases,
// FIRs, Asset Declarations, News, RTI Responses, Whistleblower Reports

export const typeDefs = `#graphql
  # ─── ENUMS ───

  enum Role {
    POLITICIAN
    BUREAUCRAT
    IAS
    IPS
    POLICE
  }

  enum PoliticalLevel {
    NATIONAL
    STATE
    DISTRICT
    BLOCK
    PANCHAYAT
  }

  enum ConstituencyType {
    LOK_SABHA
    RAJYA_SABHA
    VIDHAN_SABHA
    VIDHAN_PARISHAD
  }

  enum PromiseStatus {
    NOT_STARTED
    IN_PROGRESS
    COMPLETED
    FAILED
  }

  enum AllegationSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum AllegationStatus {
    UNVERIFIED
    INVESTIGATING
    VERIFIED
    DISMISSED
  }

  enum ClaimType {
    PROMISE_UPDATE
    NEW_PROMISE
    ALLEGATION
    GENERAL
    WHISTLEBLOWER
  }

  enum ClaimStatus {
    PENDING
    VERIFIED
    REJECTED
  }

  enum CaseType {
    CRIMINAL
    CIVIL
    PIL
    WRIT
    APPEAL
  }

  enum CaseStatus {
    PENDING
    HEARING
    CONVICTED
    ACQUITTED
    APPEALED
    DISCHARGED
  }

  enum FIRStatus {
    REGISTERED
    UNDER_INVESTIGATION
    CHARGESHEET
    CLOSED
    ACQUITTED
  }

  enum DataSource {
    INDIAN_KANOON
    ECOURTS
    MYNETA
    SANSAD
    MANUAL
    RTI
    GNEWS
    DATA_GOV
  }

  enum Sentiment {
    POSITIVE
    NEGATIVE
    NEUTRAL
  }

  enum NewsCategory {
    CORRUPTION
    DEVELOPMENT
    ELECTION
    CRIME
    POLICY
    CONTROVERSY
  }

  enum RTIStatus {
    FILED
    RESPONDED
    FIRST_APPEAL
    SECOND_APPEAL
    REJECTED
  }

  enum ReportCategory {
    CORRUPTION
    BRIBERY
    FRAUD
    MISUSE_OF_POWER
    CRIMINAL
    OTHER
  }

  enum ReportStatus {
    SUBMITTED
    UNDER_REVIEW
    VERIFIED
    DISMISSED
  }

  # ─── CORE TYPES ───

  type Official {
    id: ID!
    name: String!
    role: String!
    level: String!
    party: String
    department: String
    position: String!
    constituency: String
    constituencyType: String
    state: String!
    district: String
    assets: Float
    criminalCases: Int!
    educationQualification: String
    websiteUrl: String
    termStart: String
    termEnd: String
    profilePhoto: String
    gender: String
    age: Int
    sourceUrl: String
    promises: [Promise!]!
    allegations: [Allegation!]!
    claims: [Claim!]!
    courtCases: [CourtCase!]!
    firs: [FIR!]!
    assetDeclarations: [AssetDeclaration!]!
    newsArticles: [NewsArticle!]!
    rtiResponses: [RTIResponse!]!
    createdAt: String!
    updatedAt: String!
  }

  type Promise {
    id: ID!
    official: Official!
    title: String!
    description: String
    budgetAllotted: Float
    budgetSpent: Float
    status: String!
    proofImages: [String!]
    sourceUrl: String
    deadline: String
    createdAt: String!
    updatedAt: String!
  }

  type Allegation {
    id: ID!
    official: Official!
    title: String!
    description: String
    severity: String!
    status: String!
    proofImages: [String!]
    sourceUrl: String
    createdAt: String!
    updatedAt: String!
  }

  type Claim {
    id: ID!
    official: Official!
    submittedBy: String!
    type: String!
    title: String!
    description: String!
    evidence: [String!]
    status: String!
    aiVerificationNote: String
    aiConfidence: Int
    aiModel: String
    linkedPromise: Promise
    linkedAllegation: Allegation
    createdAt: String!
    verifiedAt: String
  }

  # ─── NEW TYPES ───

  type CourtCase {
    id: ID!
    official: Official!
    caseNumber: String!
    court: String!
    caseType: String!
    status: String!
    charges: [String!]
    filingDate: String
    lastHearingDate: String
    nextHearingDate: String
    judgment: String
    judgmentSummary: String
    sourceUrl: String
    source: String!
    createdAt: String!
    updatedAt: String!
  }

  type FIR {
    id: ID!
    official: Official!
    firNumber: String!
    policeStation: String!
    state: String!
    district: String!
    sections: [String!]!
    filingDate: String
    status: String!
    description: String
    sourceUrl: String
    createdAt: String!
  }

  type AssetDeclaration {
    id: ID!
    official: Official!
    year: Int!
    electionType: String
    movableAssets: Float
    immovableAssets: Float
    totalAssets: Float
    liabilities: Float
    spouseAssets: Float
    sourceUrl: String
    createdAt: String!
  }

  type NewsArticle {
    id: ID!
    title: String!
    summary: String
    url: String!
    source: String!
    publishedAt: String!
    sentiment: String
    category: String
    aiVerified: Boolean!
    officials: [Official!]!
  }

  type RTIResponse {
    id: ID!
    official: Official
    department: String!
    question: String!
    response: String
    filingDate: String!
    responseDate: String
    status: String!
    documentUrl: String
    submittedBy: String!
    createdAt: String!
  }

  type WhistleblowerReport {
    id: ID!
    title: String!
    description: String!
    evidence: [String!]
    category: String!
    status: String!
    isAnonymous: Boolean!
    aiVerificationNote: String
    aiConfidence: Int
    officials: [Official!]!
    createdAt: String!
  }

  type ScrapeJob {
    id: ID!
    source: String!
    status: String!
    targetId: String
    error: String
    startedAt: String
    completedAt: String
    createdAt: String!
  }

  # ─── STATS ───

  type StatsSummary {
    totalOfficials: Int!
    totalPoliticians: Int!
    totalBureaucrats: Int!
    totalPromises: Int!
    completedPromises: Int!
    pendingPromises: Int!
    totalAllegations: Int!
    highSeverityAllegations: Int!
    totalClaims: Int!
    pendingClaims: Int!
    verifiedClaims: Int!
    totalCourtCases: Int!
    totalFIRs: Int!
    totalNewsArticles: Int!
    statesTracked: Int!
  }

  # ─── QUERIES ───

  type Query {
    # Officials
    officials(role: String, state: String, level: String, party: String, limit: Int, offset: Int): [Official!]!
    official(id: ID!): Official
    searchOfficials(query: String!): [Official!]!

    # Promises
    promises(officialId: ID, status: String, limit: Int, offset: Int): [Promise!]!
    promise(id: ID!): Promise

    # Allegations
    allegations(officialId: ID, status: String, severity: String, limit: Int, offset: Int): [Allegation!]!
    allegation(id: ID!): Allegation

    # Claims
    claims(officialId: ID, status: String, type: String, limit: Int, offset: Int): [Claim!]!
    claim(id: ID!): Claim

    # Court Cases
    courtCases(officialId: ID, status: String, court: String, limit: Int, offset: Int): [CourtCase!]!
    courtCase(id: ID!): CourtCase

    # FIRs
    firs(officialId: ID, state: String, limit: Int, offset: Int): [FIR!]!
    fir(id: ID!): FIR

    # Asset Declarations
    assetDeclarations(officialId: ID, year: Int): [AssetDeclaration!]!

    # News
    newsArticles(officialId: ID, category: String, limit: Int, offset: Int): [NewsArticle!]!

    # RTI
    rtiResponses(officialId: ID, department: String, limit: Int, offset: Int): [RTIResponse!]!

    # Whistleblower
    whistleblowerReports(status: String, category: String, limit: Int, offset: Int): [WhistleblowerReport!]!

    # Scrape Jobs
    scrapeJobs(source: String, status: String, limit: Int): [ScrapeJob!]!

    # Stats
    statsSummary: StatsSummary!
  }

  # ─── MUTATIONS ───

  type Mutation {
    # Officials CRUD
    addOfficial(input: AddOfficialInput!): Official!
    updateOfficial(id: ID!, input: UpdateOfficialInput!): Official!
    deleteOfficial(id: ID!): Boolean!

    # Promises CRUD
    addPromise(input: AddPromiseInput!): Promise!
    updatePromise(id: ID!, input: UpdatePromiseInput!): Promise!
    deletePromise(id: ID!): Boolean!

    # Allegations CRUD
    addAllegation(input: AddAllegationInput!): Allegation!
    updateAllegation(id: ID!, input: UpdateAllegationInput!): Allegation!
    deleteAllegation(id: ID!): Boolean!

    # Claims (anonymous submission)
    submitClaim(input: SubmitClaimInput!): Claim!
    verifyClaim(id: ID!, input: VerifyClaimInput!): Claim!
    deleteClaim(id: ID!): Boolean!

    # Court Cases
    addCourtCase(input: AddCourtCaseInput!): CourtCase!
    updateCourtCase(id: ID!, input: UpdateCourtCaseInput!): CourtCase!

    # FIRs
    addFIR(input: AddFIRInput!): FIR!

    # Asset Declarations
    addAssetDeclaration(input: AddAssetDeclarationInput!): AssetDeclaration!

    # Whistleblower Reports (anonymous)
    submitWhistleblowerReport(input: SubmitWhistleblowerReportInput!): WhistleblowerReport!

    # RTI Responses (crowdsourced)
    submitRTIResponse(input: SubmitRTIResponseInput!): RTIResponse!

    # Scraping triggers
    triggerScrape(source: String!, officialId: ID): ScrapeJob!
  }

  # ─── INPUTS ───

  input AddOfficialInput {
    name: String!
    role: String!
    level: String!
    party: String
    department: String
    position: String!
    constituency: String
    constituencyType: String
    state: String!
    district: String
    assets: Float
    criminalCases: Int
    educationQualification: String
    websiteUrl: String
    termStart: String
    termEnd: String
    gender: String
    age: Int
    sourceUrl: String
  }

  input UpdateOfficialInput {
    name: String
    party: String
    department: String
    position: String
    constituency: String
    constituencyType: String
    state: String
    district: String
    profilePhoto: String
    assets: Float
    criminalCases: Int
    educationQualification: String
    websiteUrl: String
    termStart: String
    termEnd: String
    gender: String
    age: Int
    sourceUrl: String
  }

  input AddPromiseInput {
    officialId: ID!
    title: String!
    description: String
    budgetAllotted: Float
    status: String
    sourceUrl: String
    deadline: String
  }

  input UpdatePromiseInput {
    title: String
    description: String
    budgetAllotted: Float
    budgetSpent: Float
    status: String
    sourceUrl: String
    deadline: String
  }

  input AddAllegationInput {
    officialId: ID!
    title: String!
    description: String
    severity: String!
    sourceUrl: String
  }

  input UpdateAllegationInput {
    title: String
    description: String
    severity: String
    status: String
    sourceUrl: String
  }

  input SubmitClaimInput {
    officialId: ID!
    submittedBy: String
    type: String!
    title: String!
    description: String!
    linkedPromiseId: ID
    linkedAllegationId: ID
  }

  input VerifyClaimInput {
    status: String!
    aiVerificationNote: String!
    aiConfidence: Int
    aiModel: String
  }

  input AddCourtCaseInput {
    officialId: ID!
    caseNumber: String!
    court: String!
    caseType: String!
    status: String
    charges: [String!]
    filingDate: String
    sourceUrl: String
    source: String
  }

  input UpdateCourtCaseInput {
    status: String
    lastHearingDate: String
    nextHearingDate: String
    judgment: String
    judgmentSummary: String
    sourceUrl: String
  }

  input AddFIRInput {
    officialId: ID!
    firNumber: String!
    policeStation: String!
    state: String!
    district: String!
    sections: [String!]!
    filingDate: String
    status: String
    description: String
    sourceUrl: String
  }

  input AddAssetDeclarationInput {
    officialId: ID!
    year: Int!
    electionType: String
    movableAssets: Float
    immovableAssets: Float
    totalAssets: Float
    liabilities: Float
    spouseAssets: Float
    sourceUrl: String
  }

  input SubmitWhistleblowerReportInput {
    title: String!
    description: String!
    category: String!
    officialIds: [ID!]!
    isAnonymous: Boolean
  }

  input SubmitRTIResponseInput {
    officialId: ID
    department: String!
    question: String!
    response: String
    filingDate: String!
    responseDate: String
    status: String
    documentUrl: String
    submittedBy: String
  }
`;
