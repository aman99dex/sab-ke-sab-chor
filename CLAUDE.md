# Neta Watch — Claude Code Context

## Project Overview

Indian politician/bureaucrat accountability tracker. GraphQL API + React frontend.
Goal: host this publicly to bring transparency to Indian governance.

## Architecture

- **Backend**: Express + Apollo Server 5 at `index.js` (port 4000)
  - Schema: `schema.js` (GraphQL SDL)
  - Resolvers: `resolvers.js`
  - Data: `_db.js` (in-memory arrays — will migrate to real DB)
  - Helpers: `helpers.js` (ID generation, timestamps, image URL builder)
  - File uploads via multer at `/upload/:category`

- **Frontend**: React + Vite at `client/` (port 3000, proxies `/graphql` to backend)
  - Apollo Client 4 — uses `HttpLink` (not `uri`), hooks from `@apollo/client/react`
  - CSS animated background (no Three.js — was removed due to runtime crashes)

## Key Technical Notes

- Apollo Client 4.x: `useQuery`, `useMutation`, `ApolloProvider` must be imported from `@apollo/client/react`, NOT `@apollo/client`
- Apollo Client 4.x: requires `link: new HttpLink({uri})` instead of just `uri` in constructor
- Apollo Server 5: no built-in Express middleware — uses manual `executeHTTPGraphQLRequest` + `HeaderMap`
- ES Modules throughout (`"type": "module"` in package.json)
- GraphQL schema uses `Promise` as a type name (not a JS reserved word in GraphQL context)

## Data Model

4 entities: `Official`, `Promise`, `Allegation`, `Claim`
- Official has role enum: POLITICIAN | BUREAUCRAT
- Promise tracks budgetAllotted vs budgetSpent with status enum
- Allegation has severity (LOW/MEDIUM/HIGH) and status (UNVERIFIED/INVESTIGATING/VERIFIED/DISMISSED)
- Claim is user-submitted, gets AI-verified via `verifyClaim` mutation

## Commands

```bash
# Backend
node index.js

# Frontend
cd client && npm run dev

# Build frontend
cd client && npx vite build
```

## What Needs Work Next

- Migrate from in-memory arrays to a real database
- Add Claude API integration for automated claim verification
- Add user authentication
- Cloud hosting setup
