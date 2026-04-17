import { gql } from "@apollo/client";

export const GET_OFFICIALS = gql`
  query GetOfficials($role: Role, $state: String) {
    officials(role: $role, state: $state) {
      id
      name
      role
      party
      department
      position
      state
      district
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
      party
      department
      position
      state
      district
      profilePhoto
      promises {
        id
        title
        description
        budgetAllotted
        budgetSpent
        status
        sourceUrl
        createdAt
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
        createdAt
        verifiedAt
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
      party
      position
      state
    }
  }
`;

export const SUBMIT_CLAIM = gql`
  mutation SubmitClaim($input: SubmitClaimInput!) {
    submitClaim(input: $input) {
      id
      title
      status
    }
  }
`;

export const GET_CLAIMS = gql`
  query GetClaims($status: ClaimStatus) {
    claims(status: $status) {
      id
      title
      description
      submittedBy
      type
      status
      aiVerificationNote
      createdAt
      verifiedAt
      official {
        id
        name
      }
    }
  }
`;
