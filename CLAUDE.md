# garge-app

Next.js 16 App Router frontend for Garge — a smart garage monitoring system focused on vehicles (motorcycles etc.). Users monitor vehicle and garage health through sensor data and configure automations to protect their vehicles automatically. All data comes from garge-api via Axios.

## Tech Stack

| Concern | Library |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Auth | next-auth v4 |
| HTTP | Axios with JWT interceptors |
| Validation | Zod v4 |
| Notifications | Sonner |
| Charts | ApexCharts |
| Icons | Heroicons |

## Folder Structure

```
src/
├── app/
│   ├── (auth)/          # Public auth pages: login, register, reset-password
│   ├── (protected)/     # Authenticated pages — layout.tsx enforces auth guard
│   └── api/auth/        # next-auth API route
├── components/          # Reusable UI components
├── services/            # All API call logic, one file per domain
├── types/               # TypeScript type definitions
├── dto/                 # Types that mirror API request/response shapes
└── lib/                 # Utility functions
```

## Architecture Rules

### API Calls
- All HTTP calls live in `src/services/`. Never fetch from a component directly.
- Always use `axiosInstance` from `src/services/axiosInstance.ts` — it attaches JWT Bearer headers and handles token refresh automatically.
- Name service files `<domain>Service.ts` (e.g., `sensorService.ts`, `switchService.ts`).

### Authentication
- Use `useSession()` from next-auth in client components to read auth state.
- The `(protected)` route group layout is the single auth gate — do not add duplicate guards elsewhere.
- Never manually attach Authorization headers; axiosInstance handles this.

### Styling
- Tailwind CSS only. No CSS modules, no inline `style` props, no external component libraries.
- `globals.css` is for base/reset rules only.

### Components
- Default to server components inside `app/`. Add `"use client"` only when you need hooks, event handlers, or browser APIs.
- Reusable components go in `src/components/`. Page-specific UI stays in the route file or a co-located file.

### Types and Validation
- `src/types/` — domain types shared across the app.
- `src/dto/` — types that directly mirror API shapes (request bodies, response payloads).
- Use Zod for all form and user input validation. Derive TypeScript types from Zod schemas with `z.infer<>`.

### Notifications
- Use Sonner (`toast`) for all user-facing feedback. Never use `alert()` or log to console for user messages.

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `DeviceDashboard.tsx` |
| Services / utilities | camelCase | `sensorService.ts` |
| Route directories | kebab-case | `reset-password/` |
| Imports across dirs | `@/` alias | `import { axiosInstance } from '@/services/axiosInstance'` |

## What to Avoid
- No `any` in TypeScript — use proper types or `unknown`.
- Do not fetch data directly in components — always go through a service file.
- Do not add new icon libraries — Heroicons covers all cases.
- Do not add CSS libraries beyond Tailwind.
- Do not use `useEffect` for data fetching in client components when a server component can do the job.
