# Neta Watch — Replit Environment

## Overview

Indian politician/bureaucrat accountability tracker. GraphQL API + React frontend.
Goal: host this publicly to bring transparency to Indian governance.

## Architecture

- **Backend**: Express + Apollo Server 5 + Prisma ORM at `index.js` (port 8000)
  - Schema: `schema.js` (GraphQL SDL — 10 entity types)
  - Resolvers: `resolvers.js` (Prisma-backed)
  - Database: `db.js` (Prisma + pg adapter for PostgreSQL)
  - AI Verification: `aiVerifier.js` (tiered: Groq → HuggingFace → keyword fallback)
  - News Scraper: `scraper.js` (Google News RSS, stores to DB)
  - File uploads via multer at `/upload/:category`

- **Frontend**: React + Vite at `client/` (port 5000, proxies `/graphql`, `/api`, `/uploads` to backend)
  - Apollo Client 4 — uses `HttpLink` (not `uri`), hooks from `@apollo/client/react`
  - 3D background effects using Three.js / React Three Fiber (with WebGL error boundaries)

- **Scrapers**: `scrapers/` directory
  - `myneta.js` — MyNeta (ADR) politician criminal records & assets scraper
  - `sansad.js` — Parliament of India (sansad.in) MP profiles scraper
  - `indianKanoon.js` — Indian Kanoon court cases API client
  - `dataGov.js` — data.gov.in Open Government Data API client

## Database

- **PostgreSQL** via Replit's managed database (DATABASE_URL is runtime-managed)
- Prisma ORM v7 with pg adapter pattern (`@prisma/adapter-pg`)
- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- Config: `prisma.config.ts`

## Key Technical Notes

- **Prisma v7**: Requires adapter pattern. Uses `PrismaPg` adapter for PostgreSQL.
- **Prisma v7**: No `url` field in schema datasource — connection URL passed via `prisma.config.ts` datasource config.
- Apollo Client 4.x: `useQuery`, `useMutation`, `ApolloProvider` imported from `@apollo/client/react`
- Apollo Client 4.x: requires `link: new HttpLink({uri})` instead of just `uri` in constructor
- Apollo Server 5: no built-in Express middleware — uses manual `executeHTTPGraphQLRequest` + `HeaderMap`
- ES Modules throughout (`"type": "module"` in package.json)
- dotenv loaded via `import "dotenv/config"` at top of entry files
- WebGL/Three.js components have error boundaries — they silently fall back when no GPU is available

## Workflows

- **Backend** (console): `node index.js` on port 8000
- **Start application** (webview): `cd client && npm run dev` on port 5000

## Environment Variables

- `DATABASE_URL` — Runtime-managed by Replit (PostgreSQL)
- `GROQ_API_KEY` — Groq API (free tier, optional)
- `HF_TOKEN` — HuggingFace (free tier, optional)
- `GEMINI_API_KEY` — Google Gemini Flash (free tier, optional)
- `INDIAN_KANOON_TOKEN` — Court cases API (optional)
- `DATA_GOV_API_KEY` — data.gov.in API (optional)
- `GNEWS_API_KEY` — News aggregation backup (optional)
- `REDIS_URL` — For BullMQ job queue (optional)

## Commands

```bash
# Backend
node index.js

# Frontend
cd client && npm run dev

# Prisma
npx prisma migrate dev --name <name>   # Create migration
npx prisma generate                     # Regenerate client
npx prisma migrate deploy               # Apply migrations

# Scrapers
node scrapers/myneta.js
node scrapers/sansad.js
```

## Data Model

10 entities: `Official`, `Promise`, `Allegation`, `Claim`, `CourtCase`, `FIR`, `AssetDeclaration`, `NewsArticle`, `RTIResponse`, `WhistleblowerReport`
- Plus join tables: `NewsArticleOfficial`, `WhistleblowerReportOfficial`
- Plus tracking: `ScrapeJob`
