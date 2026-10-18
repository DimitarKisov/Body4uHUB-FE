# Body4uHUB — web

React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui. UI spec: `../design/design_handoff_identity/README.md`. API contracts: `../backend`.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
```

- Port **3000** is fixed: it matches `Cors:AllowedOrigins` and `App:FrontendUrl` (confirm-email links) in the backend's `appsettings.Local.json`.
- `/api/*` is proxied to the Identity API at `https://localhost:7001`. Override with `IDENTITY_API_URL` in `.env.local` (see `.env.example`).
- Start the backend first: `dotnet run --project ../backend/Body4uHUB.Identity.Api` (or from Visual Studio / Rider).

## Scripts

- `npm run build` — type-check + production build
- `npm run lint` — oxlint
- `npm test` — Vitest (jsdom + Testing Library), once; `npm run test:watch` while working. Helpers: `src/test/utils.tsx` (`renderScreen`, `mockApi`, `signIn`, `tr`)
- `npm run preview` — serve the production build

## Layout

```
src/
├─ api/          fetch client (bearer token, ProblemDetails) + DTO types
├─ auth/         AuthContext (session in sessionStorage, JWT expiry), route guards
├─ components/   brand/Logo, layout/{AuthLayout,AppShell,PageHeader}, ui/ (shadcn, re-themed)
├─ lib/          problem.ts (status → i18n keys), validation.ts (zod), i18n.ts, utils.ts
├─ locales/      bg.json (from design/ui_kits/identity/strings.js)
└─ pages/        screens
```
