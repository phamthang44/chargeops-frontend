# ChargeOps — Operator Web Console: Frontend Implementation Brief

## 1. Context

ChargeOps is an EV charging station booking/management platform (academic FYP, but built to production-grade practices). The backend is Java Spring Boot + PostgreSQL, with Keycloak as the identity provider (OIDC/OAuth2). This brief covers **only the frontend web console** used by station Owners, Platform Admins, and Station Staff. A separate React Native driver app exists but is out of scope here except where auth flow must stay consistent with it.

**Do not design a new login UI as a standalone app.** Authentication is fully delegated to Keycloak. The web app never collects or touches passwords directly.

## 2. Core Architectural Decision — One App, Not Three

There is **one deployable web application** (`apps/web`), not separate apps per role. Do not create separate ports/projects for "portal", "owner", and "admin". Role is resolved from the authenticated user's JWT **after** login, not by the user picking a role via a button, and not by routing to a different deployed app.

```
apps/web/                  ← single SPA, single Keycloak client, single port
packages/
  auth/                    ← Keycloak/OIDC integration, useAuth(), token/role helpers
  ui/                      ← shared design system components
  api-client/              ← typed HTTP client for the Spring Boot backend
  config/ (optional)       ← shared eslint/tsconfig/tailwind config
```

Rationale to preserve: the `apps/` vs `packages/*` split is worth the extra folder depth because it enforces a one-way import boundary (apps depend on packages, never the reverse) and leaves room for a future second app (e.g. a public station-status page) without restructuring.

## 3. Authentication Flow (Web)

- Protocol: **OIDC Authorization Code + PKCE**. This is a **public client** (`chargeops-web`) — no client secret exists or is ever embedded in frontend code.
- Library: `keycloak-js` or `react-oidc-context` (either is acceptable; pick one and use it consistently, do not mix).
- Flow:
  1. Unauthenticated user hits the app → redirected to Keycloak's hosted login page (not an in-app form).
  2. User authenticates on Keycloak's page.
  3. Keycloak redirects back to a configured callback route (e.g. `/callback`) with an authorization code.
  4. The app exchanges the code for tokens (access + refresh + ID token) via the library — do not hand-roll this exchange.
  5. Tokens are held in memory (React context/state), **never in localStorage**. Use silent refresh (iframe or refresh token rotation, per library defaults) to persist sessions across reloads.
- Do not implement a custom login form calling a password grant / ROPC endpoint. That flow is deprecated in OAuth 2.1 and defeats the purpose of delegating auth to Keycloak.
- Logout must call Keycloak's end-session endpoint, not just clear local tokens.

## 4. Role Model & Routing

Roles come from the JWT `realm_access.roles` claim. A single user **may hold multiple roles simultaneously** (e.g. a user can be both `DRIVER` and `STATION_STAFF` — these are additive, not mutually exclusive).

Relevant realm roles for this app: `ADMIN`, `OWNER`, `STATION_STAFF`. (`DRIVER` exists but belongs to the mobile app's domain.)

Build a `RoleRouter` component that runs once after auth resolves and decides which route tree to mount:

```
/callback         → token exchange, then redirect based on roles below
/admin/*          → requires ADMIN
/owner/*          → requires OWNER
/staff/*          → requires STATION_STAFF (can reuse most of the owner layout,
                     with a reduced menu — see §5)
(no matching role) → "This account has no access to the web console.
                      Please use the ChargeOps mobile app." (not a blank page,
                      not a raw 403)
```

Implement a `RequireRole` guard component/HOC for use around individual routes or nav items, e.g.:

```tsx
<RequireRole role="ADMIN">
  <AnalyticsPage />
</RequireRole>
```

**Important:** treat this routing/guarding as a UX convenience only. It must not be the sole enforcement mechanism — the Spring Boot backend independently enforces authorization on every endpoint (`@PreAuthorize` + resource-ownership checks). Do not assume the frontend guard is a security boundary; a user could tamper with client state, and the backend must reject unauthorized calls regardless of what the UI shows.

## 5. Layout & Permission Differences by Role

| Capability | Admin | Owner | Staff |
|---|---|---|---|
| Platform-wide station/user oversight | ✅ | ❌ | ❌ |
| Manage own station(s): hours, pricing (TOU), config | — | ✅ | ❌ |
| View own station(s) bookings/status | — | ✅ | ✅ |
| Toggle connector status (Available / Out of Service) | — | ✅ | ✅ |
| Handle support tickets routed to their station | — | ✅ | ✅ |
| View station revenue/analytics | — | ✅ | ❌ |
| Manage staff (add/remove staff members) | — | ✅ | ❌ |

Build `owner` and `staff` as **one layout with conditional menu items**, not two separate layouts — the permission difference is narrow (pricing, analytics, staff management are owner-only), so duplicating the shell is unnecessary.

## 6. Staff Management UI (Owner-only screen)

A screen under `/owner/staff` where an Owner can:
- View current staff members per station they own.
- Add a staff member **by email only** (no user search/browse across the platform — that would leak user data). The backend handles the branch logic (existing user gets role added; new user gets provisioned) — the frontend just submits `{ email, stationId }` and shows the result/error.
- Remove a staff member from a station (revokes their access to that station only, does not delete their account or their `DRIVER` role if they have one).

Do not build: an invitation-acceptance flow, a global user directory, or per-permission (as opposed to per-role) toggles. These are explicitly out of scope for v1 — flag them as "documented simplification" if asked, don't silently build partial versions.

## 7. Support Ticket UI (cross-cutting, appears in both Owner/Staff and Admin views)

- Ticket list view, filterable by `status` (OPEN / IN_PROGRESS / RESOLVED / CLOSED) and `category`.
- Ticket detail view: shows linked context if present (station, booking) plus an append-only message thread (chat-like, oldest-first).
- Owner/Staff scope: only tickets routed to stations they have access to (owned or staffed).
- Admin scope: all tickets, plus ability to reassign/escalate.
- No real-time updates required for v1 (polling or manual refresh is fine — do not build WebSocket infrastructure for this).
- No file attachment upload for v1 unless a general file-storage mechanism already exists elsewhere in the system.

## 8. React Native Driver App — Auth Consistency Note

Not part of this web brief's deliverable, but keep it in mind if the same team touches it: the driver app must NOT contain a custom login form. It should open Keycloak's hosted login via a system browser (e.g. `expo-auth-session`), using the same Authorization Code + PKCE flow, redirecting back via a custom URL scheme (e.g. `chargeops://auth/callback`) rather than an `https://` redirect URI. The Keycloak login page itself should ideally use one shared login theme so styling stays consistent across web and mobile.

## 9. Explicit Non-Goals for v1

Document these as deliberate scope cuts, not gaps:
- No role-selection UI of any kind (roles are never chosen by the user, only resolved from tokens).
- No separate deployed apps per role.
- No custom-built login form anywhere in the system (web or mobile) — Keycloak's hosted page + theme only.
- No WebSocket/real-time layer.
- No per-permission (granular) access control — role-based only.
- No cross-station staff assignment (a staff member's access is scoped to the stations they're explicitly added to).

## 10. Suggested Delivery Order

1. Scaffold `apps/web` + `packages/auth`, `packages/ui`, `packages/api-client` with npm workspaces.
2. Wire up Keycloak client (`chargeops-web`, public, PKCE) against a real Keycloak realm; get login → token → `RoleRouter` working with 3 test users (admin/owner/staff).
3. Build owner layout + staff layout as one shell with conditional menus (§5).
4. Build Staff Management screen (§6).
5. Build Ticket list/detail views (§7), reusable across owner/staff/admin scopes.
6. Build Admin-only views (platform oversight, ticket reassignment).
7. Only after the above works end-to-end: polish the Keycloak login theme to match app branding.
