export const typeDefs = `#graphql
  type Game {
    id: ID!
    title: String!
    platform: [String!]!
    reviews: [Review!]
  }
  type Review {
    id: ID!
    rating: Int!
    content: String!
    author: Author!
    game: Game!
  }
  type Author {
    id: ID!
    name: String!
    verified: Boolean!
    reviews: [Review!]
  }
  type Query {
    games: [Game]
    game(id: ID!): Game
    reviews: [Review]
    review(id: ID!): Review
    authors: [Author]
    author(id: ID!): Author
  }
  type Mutation {
    addGame(game: AddGameInput!): Game
    deleteGame(id: ID!): [Game]
    updateGame(id: ID!, edits: EditGameInput!): Game

    addAuthor(author: AddAuthorInput!): Author
    deleteAuthor(id: ID!): [Author]
    updateAuthor(id: ID!, edits: EditAuthorInput!): Author

    addReview(review: AddReviewInput!): Review
    deleteReview(id: ID!): [Review]
    updateReview(id: ID!, edits: EditReviewInput!): Review
  }
  input AddGameInput {
    title: String!
    platform: [String!]!
  }
  input EditGameInput {
    title: String
    platform: [String!]
  }
  input AddAuthorInput {
    name: String!
    verified: Boolean!
  }
  input EditAuthorInput {
    name: String
    verified: Boolean
  }
  input AddReviewInput {
    rating: Int!
    content: String!
    author_id: ID!
    game_id: ID!
  }
  input EditReviewInput {
    rating: Int
    content: String
  }
`