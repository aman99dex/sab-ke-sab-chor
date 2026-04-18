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
      newsArticles {
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

export const TRIGGER_SCRAPE = gql`
  mutation TriggerScrape($source: String!, $officialId: ID) {
    triggerScrape(source: $source, officialId: $officialId) {
      id
      source
      status
      targetId
      createdAt
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
