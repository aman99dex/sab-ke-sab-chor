// db.js — Prisma client singleton for Neta Watch
// Replaces the old _db.js in-memory arrays

import { PrismaClient } from "./generated/prisma/client.js";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
