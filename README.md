# garge-app

Website for Garge, backed by
[garge-api](https://github.com/sondresjolyst/garge-api). Live at
[garge.no](https://www.garge.no).

## Stack

Next.js 16 App Router, TypeScript, Tailwind CSS 4, next-auth, Axios,
SignalR, ApexCharts, zod, Vitest, Playwright.

## Quick start

```bash
npm ci
cp .env.example .env
npm run dev
```

garge-api must be running and reachable at `NEXT_PUBLIC_API_URL`.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serves the production build |
| `npm test` | Vitest |
| `npm run test:e2e` | Playwright, specs in `e2e/` |
| `npm run lint` | ESLint |

## Environment

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the API, for example `http://localhost:5277/api` |
| `NEXT_PUBLIC_BASE_URL` | Public URL of this app, used in absolute links |
| `NEXTAUTH_URL` | URL of this app |
| `NEXTAUTH_SECRET` | next-auth session secret |
| `GARGE_API_JWT_SECRET` | Must match the API's `Jwt__Key`. Unset falls back to decoding tokens without verifying them |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push application server key |
| `VAPID_PRIVATE_KEY` | Web push private key, server side only |

## Content

| Area | Holds |
| --- | --- |
| Home | Marketing page, terms, privacy, cookies, contact |
| Dashboard | Live sensor readings and historical charts, updated over SignalR |
| Automations | Threshold rules that switch power sockets |
| Electricity | Spot prices and consumption |
| Shop | Products and orders |
| Accounts | Register, sign in, profile, sensor pairing, push notification opt-in |
| Admin | Users, groups, sensors, switches, products, settings |

## Layout

```
src/
├── app/          # routes: public pages, (auth), (protected), api
├── components/   # shared UI
├── services/     # API clients, one per domain
├── hooks/        # SignalR and client state
├── dto/          # request and response shapes
├── lib/          # fetch wrappers, formatting, push helpers
├── types/        # shared types
└── proxy.ts      # request rewrites
```

## Deployment

Image [`sondresjo/garge-app`](https://hub.docker.com/r/sondresjo/garge-app) on
Docker Hub, chart `garge-app` in
[tumogroup-charts](https://github.com/sondresjolyst/tumogroup-charts), applied by
Flux from [tumo-flux](https://github.com/sondresjolyst/tumo-flux) to `garge-dev`
and `garge-prod`.

The container runs as the non-root `node` user with a read-only root filesystem,
so anything written at runtime needs a volume. The image optimizer writes to one
at `/app/.next/cache`.

A push to `main` builds the `dev` tag. A release-please release builds `vX.Y.Z`,
tags it `latest` and opens a chart bump against
[tumogroup-charts](https://github.com/sondresjolyst/tumogroup-charts). Cluster
secrets are created by
[`scripts/garge/bootstrap.sh`](https://github.com/sondresjolyst/tumo-platform/blob/main/scripts/garge/bootstrap.sh)
in [tumo-platform](https://github.com/sondresjolyst/tumo-platform).

## License

Proprietary. Copyright (c) 2026 Sondre Sjølyst.
