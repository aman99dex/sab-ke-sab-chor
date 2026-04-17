export const typeDefs = `#graphql
  enum Role {
    POLITICIAN
    BUREAUCRAT
  }

  enum PoliticalLevel {
    NATIONAL
    STATE
    DISTRICT
    BLOCK
    PANCHAYAT
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
  }

  enum ClaimStatus {
    PENDING
    VERIFIED
    REJECTED
  }

  type NewsHeadline {
    title: String!
    url: String!
    source: String!
    publishedAt: String!
  }

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
    statesTracked: Int!
  }

  type Official {
    id: ID!
    name: String!
    role: Role!
    level: PoliticalLevel!
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
    profilePhoto: String
    promises: [Promise!]
    allegations: [Allegation!]
    claims: [Claim!]
    newsHeadlines: [NewsHeadline!]
    createdAt: String!
  }

  type Promise {
    id: ID!
    official: Official!
    title: String!
    description: String
    budgetAllotted: Float
    budgetSpent: Float
    status: PromiseStatus!
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
    severity: AllegationSeverity!
    status: AllegationStatus!
    proofImages: [String!]
    sourceUrl: String
    createdAt: String!
    updatedAt: String!
  }

  type Claim {
    id: ID!
    official: Official!
    submittedBy: String!
    type: ClaimType!
    title: String!
    description: String!
    evidence: [String!]
    status: ClaimStatus!
    aiVerificationNote: String
    aiConfidence: Int
    linkedPromise: Promise
    linkedAllegation: Allegation
    createdAt: String!
    verifiedAt: String
  }

  type Query {
    officials(role: Role, state: String, level: PoliticalLevel, party: String): [Official!]
    official(id: ID!): Official

    promises(officialId: ID, status: PromiseStatus): [Promise!]
    promise(id: ID!): Promise

    allegations(officialId: ID, status: AllegationStatus): [Allegation!]
    allegation(id: ID!): Allegation

    claims(officialId: ID, status: ClaimStatus): [Claim!]
    claim(id: ID!): Claim

    searchOfficials(query: String!): [Official!]
    statsSummary: StatsSummary!
    newsHeadlines(officialId: ID!): [NewsHeadline!]
  }

  type Mutation {
    addOfficial(input: AddOfficialInput!): Official!
    updateOfficial(id: ID!, input: UpdateOfficialInput!): Official!
    deleteOfficial(id: ID!): Boolean!

    addPromise(input: AddPromiseInput!): Promise!
    updatePromise(id: ID!, input: UpdatePromiseInput!): Promise!
    deletePromise(id: ID!): Boolean!

    addAllegation(input: AddAllegationInput!): Allegation!
    updateAllegation(id: ID!, input: UpdateAllegationInput!): Allegation!
    deleteAllegation(id: ID!): Boolean!

    submitClaim(input: SubmitClaimInput!): Claim!
    verifyClaim(id: ID!, input: VerifyClaimInput!): Claim!
    deleteClaim(id: ID!): Boolean!

    triggerScrape(officialId: ID): Boolean!
  }

  input AddOfficialInput {
    name: String!
    role: Role!
    level: PoliticalLevel!
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
  }

  input AddPromiseInput {
    officialId: ID!
    title: String!
    description: String
    budgetAllotted: Float
    status: PromiseStatus
    sourceUrl: String
    deadline: String
  }

  input UpdatePromiseInput {
    title: String
    description: String
    budgetAllotted: Float
    budgetSpent: Float
    status: PromiseStatus
    sourceUrl: String
    deadline: String
  }

  input AddAllegationInput {
    officialId: ID!
    title: String!
    description: String
    severity: AllegationSeverity!
    sourceUrl: String
  }

  input UpdateAllegationInput {
    title: String
    description: String
    severity: AllegationSeverity
    status: AllegationStatus
    sourceUrl: String
  }

  input SubmitClaimInput {
    officialId: ID!
    submittedBy: String!
    type: ClaimType!
    title: String!
    description: String!
    linkedPromiseId: ID
    linkedAllegationId: ID
  }

  input VerifyClaimInput {
    status: ClaimStatus!
    aiVerificationNote: String!
    aiConfidence: Int
  }
`;
