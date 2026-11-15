# Orca

A self-hostable AI-coworker workspace, built phase by phase. Phase 1 setup is in
place; the application code is being built step by step.

## Stack

- Monorepo: Bun + Turborepo
- `apps/web` — Vite · React 19 · Tailwind CSS 4 (dev on `127.0.0.1:5173`, proxies `/api` → server)
- `apps/server` — Hono on Bun · SQLite via `bun:sqlite` (target port `8787`)
- `packages/shared` — zod contracts shared by web and server

## Run

```bash
bun install
bun dev
```

## Checks

```bash
bun run check-types
bun run build
bun run lint
```
