# garge-app

Next.js 16 frontend for the Garge garage monitoring system. Displays live sensor readings (battery voltage, temperature, humidity), historical charts, and lets users configure threshold-based automations that control power sockets in the garage.

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4**
- **next-auth v4** — authentication
- **Axios** — API calls with JWT interceptors
- **ApexCharts** — sensor data charts
- **Zod** — form and response validation

## Configuration

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL to garge-api (e.g. `http://localhost:5277/api`) |
| `NEXTAUTH_URL` | Public URL of this app |
| `NEXTAUTH_SECRET` | Random secret for session signing |

## Running

```bash
npm install
npm run dev
```
