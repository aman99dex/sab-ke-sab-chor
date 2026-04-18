# Neta Watch

An open accountability platform for tracking Indian politicians and bureaucrats — their promises, budgets, actual work done, and corruption allegations. Built to bring transparency to Indian governance.

## What It Does

- Track **officials** (politicians + bureaucrats) with their party, department, position, and location
- Track **promises** made — what was promised, budget allotted vs spent, completion status
- Track **allegations** of corruption with severity levels and investigation status
- Citizens can **submit claims** (broken promises, corruption reports) which get verified
- **AI verification** pipeline (placeholder — plug in Claude API later to auto-verify claims)
- **Image uploads** for profile photos, proof of work, proof of corruption
- **Three.js intro landing** with interactive 3D India map
- **Global person intelligence search** (Google CSE if configured + public-source fallback)
- **AI task runner API** for verification/research/scraping strategy workflows

## Tech Stack

- **Backend**: Node.js, Express, Apollo Server 5, GraphQL
- **Frontend**: React, Vite, Apollo Client 4
- **Data**: In-memory (swap to PostgreSQL/MongoDB when ready to host)
- **File Storage**: Local disk (swap to S3/Cloudinary when ready to host)

## Project Structure

```
GraphQL_Server/
  index.js          # Express + Apollo Server setup + file upload routes
  schema.js         # GraphQL type definitions (types, queries, mutations)
  resolvers.js      # All resolver logic
  _db.js            # In-memory data (seed data for dev)
  helpers.js        # Utility functions (ID generation, timestamps, image URLs)
  uploads/          # Uploaded images (gitignored)
  client/           # React frontend
    src/
      main.jsx              # Apollo Client setup
      App.jsx               # Main app with routing
      App.css               # All styles
      index.css             # Global styles + animated background
      graphql.js            # All GraphQL queries and mutations
      Background3D.jsx      # Animated background
      components/
        Header.jsx          # Nav bar
        OfficialsList.jsx   # Officials grid with search + filters
        OfficialDetail.jsx  # Single official — promises, allegations, claims
        SubmitClaim.jsx     # Claim submission form
```

## Setup

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

## Run

You need two terminals:

```bash
# Terminal 1 — backend (port 4000)
node index.js

# Terminal 2 — frontend (port 3000)
cd client && npm run dev
```

Open **http://localhost:3000**

## GraphQL API

Endpoint: `http://localhost:4000/graphql` (also proxied through frontend at `/graphql`)

### Queries

| Query | Description |
|---|---|
| `officials(role, state)` | List officials, optionally filter by role/state |
| `official(id)` | Single official with promises, allegations, claims |
| `promises(officialId, status)` | List promises |
| `allegations(officialId, status)` | List allegations |
| `claims(officialId, status)` | List claims |
| `searchOfficials(query)` | Search by name, party, position, state |

### Mutations

| Mutation | Description |
|---|---|
| `addOfficial / updateOfficial / deleteOfficial` | Manage officials |
| `addPromise / updatePromise / deletePromise` | Manage promises |
| `addAllegation / updateAllegation / deleteAllegation` | Manage allegations |
| `submitClaim` | Citizens submit a claim |
| `verifyClaim` | AI/admin verifies a claim |

### File Upload

```bash
# Upload an image
curl -F "file=@photo.jpg" http://localhost:4000/upload/profiles

# Categories: profiles, promises, allegations, claims
```

### New REST Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/people/search?q=<query>&limit=8` | GET | Global people search from Google CSE/Wikipedia/DuckDuckGo |
| `/api/people/profile?name=<person>` | GET | Person profile summary + linked sources |
| `/api/images/proxy?url=<encoded-image-url>` | GET | Server-side image proxy + in-memory cache for external images |
| `/api/images/cache/stats` | GET | Image proxy cache telemetry |
| `/api/agents/run` | POST | Run AI task (`VERIFY_CLAIM`, `GLOBAL_PERSON_RESEARCH`, `SCRAPE_STRATEGY`) |
| `/api/agents/scrape-jobs` | POST | Queue scraping jobs (`FULL_NEWS_SCRAPE`, `OFFICIAL_NEWS_SCRAPE`) |
| `/api/agents/scrape-jobs` | GET | List recent scrape jobs + queue stats |
| `/api/agents/scrape-jobs/:id` | GET | Scrape job progress details/logs |
| `/api/agents/scrape-queue/stats` | GET | Queue-level runtime stats |
| `/api/cache/stats` | GET | Inspect server-side in-memory cache stats |

Example AI task payload:

```json
{
  "taskType": "GLOBAL_PERSON_RESEARCH",
  "payload": {
    "name": "Example Official"
  }
}
```

### Optional Environment Variables

- `GOOGLE_API_KEY` + `GOOGLE_CSE_ID` for Google-powered global people search
- `GROQ_API_KEY` for richer AI agent task briefs

## Roadmap

- [ ] Real database (PostgreSQL)
- [ ] User authentication (JWT)
- [ ] Claude API integration for AI claim verification
- [ ] Cloud file storage (S3/Cloudinary)
- [ ] Pagination for large datasets
- [ ] Admin dashboard
- [ ] Public voting/upvotes on claims
- [ ] RTI data integration
- [ ] Mobile-responsive PWA
