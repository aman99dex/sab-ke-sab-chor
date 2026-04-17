// db.js — Prisma client singleton for Neta Watch
// Uses libsql adapter for SQLite (local dev)
// Switch to @prisma/adapter-pg for PostgreSQL in production

import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// Create libsql client pointing to local SQLite file
const libsql = createClient({
  url: "file:./prisma/dev.db",
});

const adapter = new PrismaLibSql(libsql);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
