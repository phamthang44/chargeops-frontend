# ChargeOps Web

Operator web console for ChargeOps — **one Vite/React app** with role-based routing, plus shared
packages via npm workspaces. One origin, one Keycloak client; the signed token roles decide which
console you land in (no portal picker). Ported from the interactive design in
[`../design-console/ChargeOps Console.dc.html`](../design-console/).

```
chargeops-web/
├─ apps/
│  └─ web/       # the single console app (dev :5173)
│     └─ src/
│        ├─ App.tsx        — providers + mock-token pick (?as=admin|owner|staff|driver)
│        ├─ RoleRouter.tsx — routes by role: /admin /owner /staff /driver-notice
│        ├─ owner/         — OwnerConsole (also serves /staff, reduced menu) + pages/features
│        └─ admin/         — AdminConsole + pages/features
└─ packages/
   ├─ tokens/   # @chargeops/tokens — Tailwind v4 theme (IBM Plex, indigo/emerald palette)
   ├─ ui/       # @chargeops/ui     — AppShell, KpiCard, StatusPill, TrendChart, icons…
   ├─ auth/     # @chargeops/auth   — AuthProvider + AuthGate + RequireRole + resolveHome
   └─ api/      # @chargeops/api    — domain types, http client, services (mock + REST)
```

## Run

```bash
npm install            # once, from chargeops-web/
npm run dev            # http://localhost:5173

# Preview each role without a backend (mock stands in for the token):
#   http://localhost:5173/?as=owner    (default)
#   http://localhost:5173/?as=admin
#   http://localhost:5173/?as=staff
#   http://localhost:5173/?as=driver
```

## Data layer: mock now, REST later

UI code never fetches directly — it calls **service interfaces** from `@chargeops/api` via
`useApi()` + TanStack Query:

```
components ──▶ useQuery(api.bookings.list(...)) ──▶ Services interface
                                                      ├─ createMockServices()  ← default
                                                      └─ createRestServices(HttpClient)
```

- **Types** (`types.ts`) mirror the SRS entities / future backend DTOs — Booking is deliberately
  denormalized (price snapshot per BookingPriceLine).
- **Mock** (`mock/`): deterministic seeded dataset ported from the design (same data every reload),
  simulated latency so loading skeletons are real, in-memory mutations so cancel/approve/rename
  flows work in demos.
- **REST** (`rest/`): thin one-line mappings onto the proposed `/api/v1` endpoints; the
  `HttpClient` adds the Keycloak bearer token, timeouts, and normalizes errors to `ApiError`.
- **Switch**: set `VITE_USE_MOCKS=false` + `VITE_API_URL` in the app's `.env` (see
  `.env.example`). Zero UI changes.

## Auth: Keycloak with mock fallback

`@chargeops/auth` uses Keycloak Authorization Code + PKCE when
`VITE_KEYCLOAK_ENABLED=true`; otherwise it keeps the local `?as=admin|owner|staff|driver` demo.
The public API (`useAuth`, `AuthGate`, `RequireRole`, `resolveHome`, `rolesFromRealm`) is the same
in both modes.

- Keycloak realm `chargeops`, **one public client `chargeops-web`** (PKCE) — not one per console.
- Realm roles `ADMIN` / `OWNER` / `DRIVER` → canonical roles via `rolesFromRealm`.
  Staff context is DB-backed (`GET /api/v1/me/staff-context`) rather than a Keycloak realm role.
  Landing destination order: Admin (`/admin`) > Owner (`/owner`) > Active Staff (`/staff`) > Driver notice (`/driver-notice`).
  Access is checked by `RequireRole` and `RequireStaffAssignment` in the UI and (authoritatively) by the backend on every REST call.
- No app ever sees a password: credentials are entered on Keycloak's hosted login page. That login
  page is a **Keycloak custom theme** (`login.ftl` + CSS), not a React component in this app.
- Copy `apps/web/.env.example` to `apps/web/.env`, set `VITE_KEYCLOAK_ENABLED=true`, and use
  `VITE_API_URL=http://localhost:8081/api/v1` with `VITE_USE_MOCKS=false` only after the backend
  REST controllers are available.
- In Keycloak, set the web client's valid redirect URI to `http://localhost:5173/*`, web origin to
  `http://localhost:5173`, and PKCE method to `S256`. The client is public; never put a secret in
  this Vite app.
- The API client calls `getToken()` before every request, so refresh and Bearer header handling stay
  inside the auth provider.

## Stack

Vite 7 · React 19 · React Router 7 · Tailwind CSS 4 (theme in `packages/tokens/tokens.css`) ·
TypeScript strict. Internal packages export raw TS — Vite compiles them directly, no build step.
