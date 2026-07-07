# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vesta Web — a self-hosted, single-user personal finance/investment tracker (Spanish-language SRS in `SRS_VestaWeb`, design system in `DESIGN.md`). It observes and visualizes wealth; it does not execute trades or give investment advice. Runs as a local Docker Compose stack (Postgres + Express backend + Vite/React frontend) on the author's home network — no auth, no multi-tenancy, no cloud concerns.

Everything (code comments, commit messages, docs) is written in Spanish; keep new comments/UI copy in Spanish to match.

## Commands

Both `backend` and `frontend` run on Bun (not Node/npm) — no build step for the backend, Bun executes TypeScript directly.

```
# Backend (from backend/)
bun install
bun run dev      # watch mode, src/index.ts
bun run start    # no watch

# Frontend (from frontend/)
bun install
bun run dev      # Vite dev server, :5173
bun run build    # tsc -b && vite build
bun run lint     # eslint .
bun test         # bun:test — runs src/**/*.test.ts (aggregate, mock, range)

# Whole stack
docker compose up   # db (Postgres 17) + backend (:3001) + frontend (:5173)
```

Run a single test file: `bun test src/lib/aggregate.test.ts` (from `frontend/`). Tests use `bun:test`, not vitest/jest, despite being frontend code.

No `.env` is required for `docker compose up`; see `.env.example` at repo root for `POSTGRES_*` and `QUOTES_API_KEY` overrides.

## Architecture

### Backend (`backend/src`)
Express 5 on Bun. Flat structure: `index.ts` wires the app and mounts routers, `db.ts` exports a single `pg` `Pool` built from `DATABASE_URL`, `routes/*.ts` are one router per resource (`categories.ts`, `transactions.ts`).

- Validation is Zod at the HTTP boundary (`createXSchema`, and `.partial()` for PATCH), even though Postgres CHECK constraints are the last line of defense (e.g. `amount > 0`).
- PATCH handlers build `SET` clauses dynamically from only the fields present in the parsed body, so unset fields aren't overwritten with NULL. `transactions.ts` additionally maps camelCase API fields to snake_case columns via `columnByField`.
- Deleting a category does not cascade-delete transactions — `category_id` is `ON DELETE SET NULL` (a movement becomes "sin categoría" rather than disappearing).

### Database (`postgresdb/*.sql`)
Plain numbered SQL files (`001_categories.sql`, `002_transactions.sql`) mounted read-only into Postgres's `/docker-entrypoint-initdb.d`. They run once, alphabetically, only when the data volume is empty — so schema changes need a new numbered file, not edits to existing ones (or a manual volume reset).

### Frontend (`frontend/src`)
React 19 + react-router-dom (data router) + Recharts, no state library. One folder per top-level screen (`dashboard/`, `movimientos/`, `cartera/`), each with its own `.css` alongside the `.tsx`; shared chrome lives in `app/` (`AppLayout` is the shell: sidebar/topbar on desktop, a drawer on mobile, both built from the same `NavList`/`ThemeToggle`/`ProfileSettingsButtons` fragments so nav markup isn't duplicated).

- **Currently frontend-only**: `lib/mock.ts` generates deterministic fake data (seeded `mulberry32` PRNG) for movements, assets, and price history — there is no `fetch` to the backend API yet. New screens should keep reading from `lib/mock.ts` / `lib/aggregate.ts` until that wiring is added.
- `lib/aggregate.ts` holds the pure data-shaping functions (sums, per-category/per-class breakdowns, portfolio series, filtering) that the mock data and future real API responses both feed into — put new derived-metric logic here, not in components.
- `lib/useTheme.ts` implements light/dark/system theme via `useSyncExternalStore`, persisted to `localStorage` under `vesta-theme`, and writes `data-theme` on `<html>` for the CSS token switch (see below). Multiple mounted instances (desktop + mobile drawer) stay in sync without prop drilling.
- Adding a new top-level route: add it to the `router` children in `App.tsx` **and** to `NAV` in `app/AppLayout.tsx`.
- Known gap (see TODO in `AppLayout.tsx`): the mobile drawer has no real focus trap yet — Tab can escape to the page behind it.

### Design system (`DESIGN.md`)
CSS custom properties in `frontend/src/index.css` (switched via `[data-theme]`) are the source of truth; `DESIGN.md` is the reference doc. Rules that matter when touching UI:

- Every financial figure (amounts, percentages, prices) gets the `.num` class (`tabular-nums`) so columns align.
- The emerald accent color is reserved for gains/focus/primary CTAs and must stay under ~10% of any screen's surface; red is the only other color signal, reserved for losses/expenses.
- Always use the semantic tokens (`--bg`, `--surface`, `--ink`, …), never raw hex, so both themes stay correct.
- No `box-shadow` on cards/panels at rest — shadow only appears as a reaction to interaction (hover/focus/menus).
- Explicitly rejected looks: navy+gold "corporate banking", generic-SaaS identical cards/gradients/stock icons, raw spreadsheet tables, gradient text, glassmorphism, choreographed/scroll-driven animation. Respect `prefers-reduced-motion`.

### Planning docs (`docs/superpowers/`)
Specs and plans from prior superpowers-driven work (e.g. `specs/2026-07-05-frontend-redesign-4-screens-design.md`) live here — check for a relevant existing plan/spec before starting related frontend work.
