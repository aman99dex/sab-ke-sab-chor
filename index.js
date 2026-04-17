import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./schema.js";
import db from "./_db.js";

const resolvers = {
  Query: {
    games: () => db.games,
    game: (_, args) => db.games.find((g) => g.id === args.id),
    reviews: () => db.reviews,
    review: (_, args) => db.reviews.find((r) => r.id === args.id),
    authors: () => db.authors,
    author: (_, args) => db.authors.find((a) => a.id === args.id),
  },
  Game: {
    reviews: (parent) => db.reviews.filter((r) => r.game_id === parent.id),
  },
  Author: {
    reviews: (parent) => db.reviews.filter((r) => r.author_id === parent.id),
  },
  Review: {
    game: (parent) => db.games.find((g) => g.id === parent.game_id),
    author: (parent) => db.authors.find((a) => a.id === parent.author_id),
  },
  Mutation: {
    addGame: (_, args) => {
      const game = { ...args.game, id: String(db.games.length + 1) };
      db.games.push(game);
      return game;
    },
    deleteGame: (_, args) => {
      db.games = db.games.filter((g) => g.id !== args.id);
      return db.games;
    },
    updateGame: (_, args) => {
      db.games = db.games.map((g) =>
        g.id === args.id ? { ...g, ...args.edits } : g
      );
      return db.games.find((g) => g.id === args.id);
    },

    addAuthor: (_, args) => {
      const author = { ...args.author, id: String(db.authors.length + 1) };
      db.authors.push(author);
      return author;
    },
    deleteAuthor: (_, args) => {
      db.authors = db.authors.filter((a) => a.id !== args.id);
      return db.authors;
    },
    updateAuthor: (_, args) => {
      db.authors = db.authors.map((a) =>
        a.id === args.id ? { ...a, ...args.edits } : a
      );
      return db.authors.find((a) => a.id === args.id);
    },

    addReview: (_, args) => {
      const review = { ...args.review, id: String(db.reviews.length + 1) };
      db.reviews.push(review);
      return review;
    },
    deleteReview: (_, args) => {
      db.reviews = db.reviews.filter((r) => r.id !== args.id);
      return db.reviews;
    },
    updateReview: (_, args) => {
      db.reviews = db.reviews.map((r) =>
        r.id === args.id ? { ...r, ...args.edits } : r
      );
      return db.reviews.find((r) => r.id === args.id);
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`Server ready at: ${url}`);
