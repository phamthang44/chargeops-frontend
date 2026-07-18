# ChargeOps Console

Web console monorepo for ChargeOps operators — **3 separately deployable apps** sharing one set of
packages via npm workspaces. Ported from the interactive design in
[`../design-console/ChargeOps Console.dc.html`](../design-console/).

```
console/
├─ apps/
│  ├─ portal/   # chargeops.vn        — entry launcher + SSO redirect   (dev :5170)
│  ├─ owner/    # owner.chargeops.vn  — station-owner console           (dev :5171)
│  └─ admin/    # admin.chargeops.vn  — platform-admin console          (dev :5172)
└─ packages/
   ├─ tokens/   # @chargeops/tokens — Tailwind v4 theme (IBM Plex, indigo/emerald palette)
   ├─ ui/       # @chargeops/ui     — AppShell, KpiCard, StatusPill, TrendChart, icons…
   ├─ auth/     # @chargeops/auth   — auth provider + AuthGate + RequireRole
   └─ api/      # @chargeops/api    — domain types, http client, services (mock + REST)
```

## Run

```bash
npm install            # once, from console/
npm run dev:portal     # http://localhost:5170
npm run dev:owner      # http://localhost:5171
npm run dev:admin      # http://localhost:5172
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
overlay → fake token with realm roles). The public API (`useAuth`, `AuthGate`, `RequireRole`) is
shaped after Keycloak's token model, so switching to the real thing is contained inside
`packages/auth`:

- Keycloak realm `chargeops`, public clients `portal`, `owner-console`, `admin-console` (PKCE).
- Realm roles: `station_owner`, `platform_admin` — carried in the access token, checked by
  `RequireRole` in the UI and (authoritatively) by the Spring Boot backend on every REST call.
- No app ever sees a password: credentials are entered on Keycloak's hosted login page.
- SSO: after logging in once, opening another console silently obtains its own tokens from the
  existing Keycloak session cookie.

## Stack

Vite 7 · React 19 · React Router 7 · Tailwind CSS 4 (theme in `packages/tokens/tokens.css`) ·
TypeScript strict. Internal packages export raw TS — Vite compiles them directly, no build step.
