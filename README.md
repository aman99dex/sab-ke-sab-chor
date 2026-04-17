# Neta Watch

An open accountability platform for tracking Indian politicians and bureaucrats — their promises, budgets, actual work done, and corruption allegations. Built to bring transparency to Indian governance.

## What It Does

- Track **officials** (politicians + bureaucrats) with their party, department, position, and location
- Track **promises** made — what was promised, budget allotted vs spent, completion status
- Track **allegations** of corruption with severity levels and investigation status
- Citizens can **submit claims** (broken promises, corruption reports) which get verified
- **AI verification** pipeline (placeholder — plug in Claude API later to auto-verify claims)
- **Image uploads** for profile photos, proof of work, proof of corruption

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
