# Neta Watch — Claude Code Context

## Project Overview

Indian politician/bureaucrat accountability tracker. GraphQL API + React frontend.
Goal: host this publicly to bring transparency to Indian governance.

## Architecture

- **Backend**: Express + Apollo Server 5 + Prisma ORM at `index.js` (port 4000)
  - Schema: `schema.js` (GraphQL SDL — 10 entity types)
  - Resolvers: `resolvers.js` (Prisma-backed)
  - Database: `db.js` (Prisma + better-sqlite3 adapter for local dev)
  - AI Verification: `aiVerifier.js` (tiered: Groq → HuggingFace → keyword fallback)
  - News Scraper: `scraper.js` (Google News RSS, stores to DB)
  - File uploads via multer at `/upload/:category`

- **Frontend**: React + Vite at `client/` (port 3000, proxies `/graphql` to backend)
  - Apollo Client 4 — uses `HttpLink` (not `uri`), hooks from `@apollo/client/react`
  - CSS animated background (no Three.js — was removed due to runtime crashes)

- **Scrapers**: `scrapers/` directory
  - `myneta.js` — MyNeta (ADR) politician criminal records & assets scraper
  - `sansad.js` — Parliament of India (sansad.in) MP profiles scraper
  - `indianKanoon.js` — Indian Kanoon court cases API client
  - `dataGov.js` — data.gov.in Open Government Data API client

- **Database**: SQLite (local dev via better-sqlite3) / PostgreSQL (production via Supabase)
  - Prisma ORM v7 with client engine + adapter pattern
  - Schema: `prisma/schema.prisma`
  - Migrations: `prisma/migrations/`
  - Config: `prisma.config.ts`

## Key Technical Notes

- **Prisma v7**: Requires adapter pattern. `PrismaBetterSqlite3({url: "file:./prisma/dev.db"})` for local, switch to `@prisma/adapter-pg` for production PostgreSQL.
- **Prisma v7**: Generated client is TypeScript at `generated/prisma/client.ts`. Import with `.ts` extension works in Node.js ESM.
- Apollo Client 4.x: `useQuery`, `useMutation`, `ApolloProvider` must be imported from `@apollo/client/react`, NOT `@apollo/client`
- Apollo Client 4.x: requires `link: new HttpLink({uri})` instead of just `uri` in constructor
- Apollo Server 5: no built-in Express middleware — uses manual `executeHTTPGraphQLRequest` + `HeaderMap`
- ES Modules throughout (`"type": "module"` in package.json)
- dotenv loaded via `import "dotenv/config"` at top of entry files

## Data Model

10 entities: `Official`, `Promise`, `Allegation`, `Claim`, `CourtCase`, `FIR`, `AssetDeclaration`, `NewsArticle`, `RTIResponse`, `WhistleblowerReport`
- Plus join tables: `NewsArticleOfficial`, `WhistleblowerReportOfficial`
- Plus tracking: `ScrapeJob`
- Official roles: POLITICIAN | BUREAUCRAT | IAS | IPS | POLICE
- Levels: NATIONAL | STATE | DISTRICT | BLOCK | PANCHAYAT
- All JSON arrays (proofImages, evidence, charges, sections) stored as JSON strings in SQLite

## AI Verification (All Free Tiers)

- **Tier 1**: Groq Llama 3 (1,000 req/day free) — structured JSON verdict
- **Tier 2**: HuggingFace BART-MNLI (~1,000 req/day free) — zero-shot classification
- **Tier 3**: Keyword-based offline analysis — last resort fallback
- **Bonus**: Gemini Flash extraction helper for scraper use (100-1,000 req/day free)

## Environment Variables (.env)

- `DATABASE_URL` — SQLite: `file:./prisma/dev.db` | PostgreSQL: `postgresql://...`
- `GROQ_API_KEY` — Groq API (free tier)
- `HF_TOKEN` — HuggingFace (free tier)
- `GEMINI_API_KEY` — Google Gemini Flash (free tier)
- `INDIAN_KANOON_TOKEN` — Court cases API (₹10K/mo free for non-commercial)
- `DATA_GOV_API_KEY` — data.gov.in API
- `GNEWS_API_KEY` — News aggregation backup
- `REDIS_URL` — For BullMQ job queue (Upstash free tier)

## Commands

```bash
# Backend
node index.js

# Frontend
cd client && npm run dev

# Prisma
npx prisma migrate dev --name <name>   # Create migration
npx prisma generate                     # Regenerate client
npx prisma studio                       # Visual DB editor

# Scrapers
node scrapers/myneta.js                 # Scrape Lok Sabha MPs from MyNeta
node scrapers/sansad.js                 # Scrape MPs from Parliament website
node scrapers/indianKanoon.js <id>      # Search court cases for official

# Build frontend
cd client && npx vite build
```

## What Needs Work Next

- Connect frontend to expanded GraphQL schema (new pages for court cases, FIRs, etc.)
- Set up BullMQ job queue with Redis for scheduled scraping
- Register API keys (Indian Kanoon, data.gov.in, Groq, Gemini)
- Seed database with initial MP data via scrapers
- Deploy: Oracle Cloud Always Free + Supabase + Cloudflare
