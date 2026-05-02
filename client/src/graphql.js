import { gql } from "@apollo/client";

export const GET_OFFICIALS = gql`
  query GetOfficials($role: String, $state: String, $level: String, $party: String) {
    officials(role: $role, state: $state, level: $level, party: $party) {
      id
      name
      role
      level
      party
      department
      position
      constituency
      constituencyType
      state
      district
      assets
      criminalCases
      profilePhoto
    }
  }
`;

export const GET_OFFICIAL = gql`
  query GetOfficial($id: ID!) {
    official(id: $id) {
      id
      name
      role
      level
      party
      department
      position
      constituency
      constituencyType
      state
      district
      assets
      criminalCases
      educationQualification
      websiteUrl
      termStart
      termEnd
      profilePhoto
      promises {
        id
        title
        description
        budgetAllotted
        budgetSpent
        status
        sourceUrl
        deadline
        createdAt
        updatedAt
      }
      allegations {
        id
        title
        description
        severity
        status
        sourceUrl
        createdAt
      }
      claims {
        id
        title
        description
        submittedBy
        type
        status
        aiVerificationNote
        aiConfidence
        createdAt
        verifiedAt
      }
      courtCases {
        id
        caseNumber
        court
        caseType
        status
        charges
        filingDate
        lastHearingDate
        nextHearingDate
        judgmentSummary
        sourceUrl
      }
      newsArticles {
        id
        title
        url
        source
        publishedAt
      }
    }
  }
`;

export const SEARCH_OFFICIALS = gql`
  query SearchOfficials($query: String!) {
    searchOfficials(query: $query) {
      id
      name
      role
      level
      party
      position
      constituency
      state
      district
      criminalCases
    }
  }
`;

export const GET_STATS_SUMMARY = gql`
  query GetStatsSummary {
    statsSummary {
      totalOfficials
      totalPoliticians
      totalBureaucrats
      totalPromises
      completedPromises
      pendingPromises
      totalAllegations
      highSeverityAllegations
      totalClaims
      pendingClaims
      verifiedClaims
      totalCourtCases
      statesTracked
    }
  }
`;

export const SUBMIT_CLAIM = gql`
  mutation SubmitClaim($input: SubmitClaimInput!) {
    submitClaim(input: $input) {
      id
      title
      status
      aiVerificationNote
      aiConfidence
    }
  }
`;

export const VERIFY_CLAIM = gql`
  mutation VerifyClaim($id: ID!, $input: VerifyClaimInput!) {
    verifyClaim(id: $id, input: $input) {
      id
      status
      aiVerificationNote
      aiConfidence
      verifiedAt
    }
  }
`;

export const GET_CLAIMS = gql`
  query GetClaims($status: String) {
    claims(status: $status) {
      id
      title
      description
      submittedBy
      type
      status
      aiVerificationNote
      aiConfidence
      createdAt
      verifiedAt
      official {
        id
        name
        state
      }
    }
  }
`;

export const GET_ALLEGATIONS = gql`
  query GetAllegations($severity: String, $status: String) {
    allegations(severity: $severity, status: $status) {
      id
      title
      description
      severity
      status
      sourceUrl
      createdAt
      official {
        id
        name
        state
        party
        role
      }
    }
  }
`;

export const GET_COURT_CASES = gql`
  query GetCourtCases($status: String) {
    courtCases(status: $status) {
      id
      caseNumber
      court
      caseType
      status
      charges
      filingDate
      lastHearingDate
      nextHearingDate
      judgmentSummary
      sourceUrl
      official {
        id
        name
        state
        party
      }
    }
  }
`;

export const GET_NEWS = gql`
  query GetNews($limit: Int) {
    newsArticles(limit: $limit) {
      id
      title
      url
      source
      publishedAt
      sentiment
      category
      officials {
        id
        name
        state
      }
    }
  }
`;

export const GET_OFFICIALS_FOR_LEADERBOARD = gql`
  query GetOfficialsLeaderboard {
    officials(limit: 100) {
      id
      name
      role
      level
      party
      state
      position
      assets
      criminalCases
      promises {
        status
      }
      allegations {
        severity
      }
    }
  }
`;
