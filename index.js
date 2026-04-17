import express from "express";
import http from "http";
import cors from "cors";
import multer from "multer";
import path from "path";
import { ApolloServer, HeaderMap } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";
import { PORT } from "./helpers.js";

const ALLOWED_CATEGORIES = ["profiles", "promises", "allegations", "claims"];
const ALLOWED_MIMETYPES = ["image/jpeg", "image/png", "image/webp"];

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

httpServer.listen(PORT, () => {
  console.log(`GraphQL:     http://localhost:${PORT}/graphql`);
  console.log(`File upload: POST http://localhost:${PORT}/upload/:category`);
  console.log(`Files:       http://localhost:${PORT}/uploads/`);
});
