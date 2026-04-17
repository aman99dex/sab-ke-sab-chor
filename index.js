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
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`Server ready at: ${url}`);
