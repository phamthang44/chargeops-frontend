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

## Auth: mock now, Keycloak later

`@chargeops/auth` currently **simulates** the Keycloak Authorization Code + PKCE flow (short SSO
overlay → fake token with realm roles). The public API (`useAuth`, `AuthGate`, `RequireRole`,
`resolveHome`, `rolesFromRealm`) is shaped after Keycloak's token model, so switching to the real
thing is contained inside `packages/auth` + `App.tsx`:

- Keycloak realm `chargeops`, **one public client `chargeops-web`** (PKCE) — not one per console.
- Realm roles `ADMIN` / `OWNER` / `STATION_STAFF` / `DRIVER` → canonical roles via `rolesFromRealm`;
  `resolveHome(roles)` picks the landing console (admin > owner > staff > driver). Access is checked
  by `RequireRole` in the UI and (authoritatively) by the Spring Boot backend on every REST call —
  typing `/admin` without the role hits the no-access screen, never the data.
- No app ever sees a password: credentials are entered on Keycloak's hosted login page. That login
  page is a **Keycloak custom theme** (`login.ftl` + CSS), not a React component in this app.
- Real mode replaces the `?as=` mock pick in `App.tsx` with the roles from the decoded access token.

## Stack

Vite 7 · React 19 · React Router 7 · Tailwind CSS 4 (theme in `packages/tokens/tokens.css`) ·
TypeScript strict. Internal packages export raw TS — Vite compiles them directly, no build step.
