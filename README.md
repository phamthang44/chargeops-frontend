# ChargeOps — Frontend

EV charging station booking & management platform for Vietnam — BSc (Hons) Computing Final Year
Project. ChargeOps connects independent EV charging station owners with EV drivers: drivers discover
stations, pre-book time slots, pay upfront, and check in by QR; owners manage stations, chargers,
slots and pricing; admins approve stations, provision chargers, and monitor the platform.

This repository is the **frontend monorepo** — it holds all the client apps plus the shared design
system, design assets, and project documents. **The backend lives in a separate repository.**

## Repositories

ChargeOps is split into two repos:

| Repo | Contents | Stack |
|---|---|---|
| **`chargeops-frontend`** (this repo) | Driver / owner / admin clients, Keycloak UI, and shared design system | React Native (Expo), React/Next.js, FreeMarker |
| **`chargeops-backend`** (separate) | REST API, business logic, database, auth | Java 17 + Spring Boot 3.x, PostgreSQL + PostGIS |

The clients talk to the backend **only over REST**. During development the client service layer
returns mock data; pointing it at the real `chargeops-backend` API later does not change any UI.

## Structure (this repo)

```
chargeops-frontend/
  chargeops-driver-mobile/   # Driver app — Expo / React Native (active)
  chargeops-web/             # Operator web console — single role-routed app (Vite/React, active)
  chargeops-marketing/       # Marketing site — Next.js (active)
  chargeops-keycloak/        # Hosted auth UI — Account Console, login and email themes
  design-console/            # Interactive console design (.dc.html, source of the console UI)
  designs/                   # Visily screen exports (visual reference)
  documents/                 # SRS and project documents
  DESIGN_SYSTEM.md           # Shared design tokens & component vocabulary (source of truth)
```

Each top-level app is **self-contained** (its own build configuration and dependencies) — a single git
repo at this root tracks them all (no per-app `.git`). The operator web console is itself an
npm-workspaces monorepo — one app (`apps/web`) with role-based routing, sharing UI/auth/token/api
packages — see [`chargeops-web/README.md`](chargeops-web/README.md). Shared visual rules live in
[`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md); the authoritative behavior spec is the SRS in
[`documents/`](documents/).

Keycloak-hosted screens live together under [`chargeops-keycloak/`](chargeops-keycloak/README.md).
The Spring repository only builds and runs that UI through Docker Compose; it does not own its source.

## Tech stack (per SRS)

| Part | Stack | Repo |
|---|---|---|
| Driver client | React Native (Expo) — mobile (iOS/Android) | this repo |
| Owner client | React Native (Expo) — mobile (per SRS) | this repo |
| Admin client | React / Next.js — web | this repo |
| Authentication UI | React Account Console + Keycloak FreeMarker themes | this repo |
| Backend API | Java 17 + Spring Boot 3.x, layered (Controller → Service → Repository) | `chargeops-backend` |
| Database | PostgreSQL + PostGIS | `chargeops-backend` |
| Auth | JWT access + refresh tokens, role-based (DRIVER / OWNER / ADMIN) | `chargeops-backend` |
| Payments | VNPay / MoMo / ZaloPay (sandbox only) | `chargeops-backend` |
| Maps | Google Maps API (OpenStreetMap fallback) | clients |

## Driver app — getting started

> The driver app is pinned to **Expo SDK 54** (target device Expo Go supports SDK 54). Do not upgrade
> Expo. See [`chargeops-driver-mobile/CLAUDE.md`](chargeops-driver-mobile/CLAUDE.md).

```bash
cd chargeops-driver-mobile
npm install
npm start          # scan the QR in Expo Go (SDK 54)
```

Architecture rules across all clients:
- **UI never calls data directly** — everything flows through a service layer (mock now, real
  `chargeops-backend` REST later); swapping the implementation does not change any UI.
- **Styling uses design tokens only** (no hardcoded colors/spacing/font sizes).
- **All user-facing text goes through i18n** (Vietnamese default, English supported).

## Author

Pham Duc Thang — 001407356 — BSc (Hons) Computing, 2024–2025.
