import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import multer from "multer";
import path from "path";
import { ApolloServer, HeaderMap } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";
import prisma from "./db.js";
import { startScraperDaemon } from "./scraper.js";

const PORT = process.env.PORT || 4000;
const ALLOWED_CATEGORIES = ["profiles", "promises", "allegations", "claims", "evidence", "documents"];
const ALLOWED_MIMETYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const app = express();
const httpServer = http.createServer(app);
app.use(cors());

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();

app.use("/graphql", express.json(), async (req, res) => {
  const headers = new HeaderMap();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: req.method,
      headers,
      body: req.body,
      search: new URL(req.url, `http://${req.headers.host}`).search ?? "",
    },
    context: async () => ({}),
  });

  for (const [key, value] of httpGraphQLResponse.headers) {
    res.setHeader(key, value);
  }
  res.status(httpGraphQLResponse.status || 200);

  if (httpGraphQLResponse.body.kind === "complete") {
    res.send(httpGraphQLResponse.body.string);
  } else {
    for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
      res.write(chunk);
    }
    res.end();
  }
});

// Manual scrape trigger (dev/admin use)
app.post("/api/scrape/trigger", express.json(), async (req, res) => {
  const { officialId } = req.body || {};
  const { scrapeOne, scrapeAll } = await import("./scraper.js");
  if (officialId) {
    const ok = await scrapeOne(officialId);
    res.json({ ok, officialId });
  } else {
    scrapeAll().catch(console.error);
    res.json({ ok: true, message: "Full scrape started in background." });
  }
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected", error: err.message });
  }
});

// DB stats endpoint
app.get("/api/stats", async (req, res) => {
  const officials = await prisma.official.count();
  const promises = await prisma.promise.count();
  const courtCases = await prisma.courtCase.count();
  const claims = await prisma.claim.count();
  const news = await prisma.newsArticle.count();
  res.json({ officials, promises, courtCases, claims, news });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.params.category;
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return cb(new Error("Invalid upload category"));
    }
    cb(null, `uploads/${category}`);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.category}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, ALLOWED_MIMETYPES.includes(file.mimetype));
  },
});

app.use("/uploads", express.static("uploads"));

app.post("/upload/:category", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({
    filename: req.file.filename,
    url: `http://localhost:${PORT}/uploads/${req.params.category}/${req.file.filename}`,
  });
});

// Start the scraper daemon
startScraperDaemon();

httpServer.listen(PORT, () => {
  console.log(`\n🇮🇳  Neta Watch Backend v3.0 (Prisma + SQLite)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`GraphQL:        http://localhost:${PORT}/graphql`);
  console.log(`Health check:   http://localhost:${PORT}/api/health`);
  console.log(`DB stats:       http://localhost:${PORT}/api/stats`);
  console.log(`File upload:    POST http://localhost:${PORT}/upload/:category`);
  console.log(`Files served:   http://localhost:${PORT}/uploads/`);
  console.log(`Scrape trigger: POST http://localhost:${PORT}/api/scrape/trigger`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
