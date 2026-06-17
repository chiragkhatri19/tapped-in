# Tappd In

[![CI](https://github.com/chiragkhatri19/tapped-in/actions/workflows/ci.yml/badge.svg)](https://github.com/chiragkhatri19/tapped-in/actions/workflows/ci.yml)

> The fitness app that shows its work.

**Tappd In** is an evidence-first fitness OS for a global audience. It replaces four apps — nutrition tracker, workout planner, AI coach, and science library — with one product where **every recommendation cites a peer-reviewed study (with DOIs)**.

Three things make it different:

- **Mandatory oil tracking** for cooked meals (the hidden-calorie killer).
- **Custom NEAT scoring (0–100)** instead of generic activity multipliers.
- **Evidence cards** — every nutrition, calorie, or training claim maps to a citation.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 · React Native 0.81 (New Architecture) |
| Router | Expo Router v6 (file-based, typed routes) |
| Language | TypeScript (strict) |
| State | Zustand (selector patterns + MMKV persistence) |
| Storage | MMKV (settings/flags) · Expo SQLite + Drizzle (logs) · WatermelonDB (synced user data) |
| Auth | Supabase Auth |
| Styling | NativeWind v4 (Tailwind v3) · `useColors()` runtime theme |
| Backend | Node.js + Fastify v5 (Railway) · Gemini 1.5 Flash for meal scan |

## Getting started

```bash
npm install
npx expo start          # dev server (Metro)
npx expo start --tunnel # physical device via ngrok
npm run typecheck       # strict tsc
npm run lint            # eslint
```

Copy `.env.example` → `.env` and fill in your keys. The backend has its own `backend/.env.example`.

## Repository layout

```
app/          Expo Router screens & navigation
components/   Reusable UI components
lib/          Engines (calorie/macro), database, utilities
stores/       Zustand state stores
data/         Static data (foods, exercises, evidence cards)
types/        Shared TypeScript interfaces (UI format)
hooks/        Custom hooks
constants/    Theme tokens & constants
context/      Onboarding context
shared/       Schemas/prompts shared with the backend
plugins/      Expo config plugins (native customizations)
scripts/      Build & tooling scripts
backend/      Fastify API (deployed to Railway)
docs/         Product & engineering docs (canonical)
```

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — single source of truth for architecture decisions.
- **[docs/](docs/)** — PRD, system plans, science library, and launch plan.

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)**. Every change goes through a PR that must pass CI and automated review before merge.

## License

Proprietary — all rights reserved. See [LICENSE](LICENSE).
