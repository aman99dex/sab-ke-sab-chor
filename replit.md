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
  - News Scraper: `scraper.js` (Google News RSS, stores to DB) — runs every 30 min
  - Daily AI Agent: `dailyAgent.js` (node-cron, runs at 02:00 AM IST daily)
  - File uploads via multer at `/upload/:category`

- **Frontend**: React + Vite at `client/` (port 5000, proxies `/graphql`, `/api`, `/uploads` to backend)
  - **React Router v6** — URL-based routing with browser history
  - Apollo Client 4 — uses `HttpLink` (not `uri`), hooks from `@apollo/client/react`
  - 3D background effects using Three.js / React Three Fiber (with WebGL error boundaries)

- **Scrapers**: `scrapers/` directory
  - `myneta.js` — MyNeta (ADR) politician criminal records & assets scraper
  - `sansad.js` — Parliament of India (sansad.in) MP profiles scraper
  - `indianKanoon.js` — Indian Kanoon court cases API client
  - `dataGov.js` — data.gov.in Open Government Data API client

## Pages / Routes

| Route | Page | Description |
|---|---|---|
| `/` | Home / Officials | Hero + search + officials grid |
| `/officials` | Officials List | Full filterable officials list |
| `/official/:id` | Official Detail | 7-tab detail: Overview, Promises, Allegations, Court Cases, Claims, News, Assets |
| `/dashboard` | Dashboard | Stats overview, level breakdown, pending claims |
| `/allegations` | Allegations Feed | All allegations across officials, filterable by severity & status |
| `/court-cases` | Court Cases Tracker | All court cases, filterable by status |
| `/news` | News Feed | Live scraped news from 10+ Indian sources |
| `/leaderboard` | Leaderboard | Officials ranked by criminal cases, assets, promises, allegations |
| `/submit` | Submit Claim | Citizen claim submission with AI verification |
| `/about` | About | Mission, how it works, data sources, AI stack |

## Database

- **PostgreSQL** via Replit's managed database (DATABASE_URL is runtime-managed)
- Prisma ORM v7 with pg adapter pattern (`@prisma/adapter-pg`)
- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- Config: `prisma.config.ts`

## Key Technical Notes

- **React Router**: `BrowserRouter` in `main.jsx`, `Routes/Route` in `App.jsx`. Header uses `useLocation()` directly.
- **OfficialDetail**: uses `useParams()` to get `:id` from URL — no prop needed.
- **Prisma v7**: Requires adapter pattern. Uses `PrismaPg` adapter for PostgreSQL.
- **Prisma v7**: No `url` field in schema datasource — connection URL passed via `prisma.config.ts` datasource config.
- Apollo Client 4.x: `useQuery`, `useMutation`, `ApolloProvider` imported from `@apollo/client/react`
- Apollo Client 4.x: requires `link: new HttpLink({uri})` instead of just `uri` in constructor
- Apollo Server 5: no built-in Express middleware — uses manual `executeHTTPGraphQLRequest` + `HeaderMap`
- ES Modules throughout (`"type": "module"` in package.json)
- dotenv loaded via `import "dotenv/config"` at top of entry files
- WebGL/Three.js components have error boundaries — they silently fall back when no GPU is available
- **Intro screen**: `sessionStorage` key `neta:introSeen` — set to `"1"` after first visit. State-based, not route-based.

## Daily AI Agent (`dailyAgent.js`)

Runs automatically at 02:00 AM IST (20:30 UTC) via node-cron:
1. Full news scrape for all tracked officials
2. Re-verify pending citizen claims with AI (Groq → HuggingFace fallback)
3. Refresh official profiles from external intel (Wikipedia, etc.)

Endpoints:
- `GET /api/agents/daily-status` — last run time, counts, errors
- `POST /api/agents/daily-trigger` — trigger manually (non-blocking)

## Workflows

- **Backend** (console): `node index.js` on port 8000
- **Start application** (webview): `cd client && npm run dev` on port 5000

## Environment Variables

- `DATABASE_URL` — Runtime-managed by Replit (PostgreSQL)
- `GROQ_API_KEY` — Groq API (free tier, optional) — used for AI verification
- `HF_TOKEN` — HuggingFace (free tier, optional) — fallback AI classifier
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

# GoI-compliant India map (regenerate if needed)
node scripts/generate-goi-map.js
```

## Data Model

10 entities: `Official`, `Promise`, `Allegation`, `Claim`, `CourtCase`, `FIR`, `AssetDeclaration`, `NewsArticle`, `RTIResponse`, `WhistleblowerReport`
- Plus join tables: `NewsArticleOfficial`, `WhistleblowerReportOfficial`
- Plus tracking: `ScrapeJob`

## Map

- GoI-compliant India map: `client/public/maps/india-states-simplified.geojson` (36 features)
- Custom J&K and Ladakh polygons matching Survey of India claimed boundaries (includes PoK, Aksai Chin)
- Map renderer: `client/src/components/IndiaMapSVG.jsx` — SCALE=21, viewBox 0 0 600 760
