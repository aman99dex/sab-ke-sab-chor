export const typeDefs = `#graphql
  enum Role {
    POLITICIAN
    BUREAUCRAT
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

  type Official {
    id: ID!
    name: String!
    role: Role!
    party: String
    department: String
    position: String!
    state: String!
    district: String
    profilePhoto: String
    promises: [Promise!]
    allegations: [Allegation!]
    claims: [Claim!]
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
    linkedPromise: Promise
    linkedAllegation: Allegation
    createdAt: String!
    verifiedAt: String
  }

  type Query {
    officials(role: Role, state: String): [Official!]
    official(id: ID!): Official

    promises(officialId: ID, status: PromiseStatus): [Promise!]
    promise(id: ID!): Promise

    allegations(officialId: ID, status: AllegationStatus): [Allegation!]
    allegation(id: ID!): Allegation

    claims(officialId: ID, status: ClaimStatus): [Claim!]
    claim(id: ID!): Claim

    searchOfficials(query: String!): [Official!]
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
  }

  input AddOfficialInput {
    name: String!
    role: Role!
    party: String
    department: String
    position: String!
    state: String!
    district: String
  }

  input UpdateOfficialInput {
    name: String
    party: String
    department: String
    position: String
    state: String
    district: String
    profilePhoto: String
  }

  input AddPromiseInput {
    officialId: ID!
    title: String!
    description: String
    budgetAllotted: Float
    status: PromiseStatus
    sourceUrl: String
  }

  input UpdatePromiseInput {
    title: String
    description: String
    budgetAllotted: Float
    budgetSpent: Float
    status: PromiseStatus
    sourceUrl: String
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
  }
`;
