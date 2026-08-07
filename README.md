# SoulSync

Compatibility-based relationship application. Monorepo (npm workspaces):

- `client/` — React + TypeScript + Vite
- `server/` — Node + Express + TypeScript
- `packages/shared-types/` — DTOs shared between client and server

## Development

```bash
npm install
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

Copy `.env.example` to `.env` in `server/` (and `client/` if needed) before running.

## Status

Phase 1 (foundation) in progress. See project brief for full roadmap.
