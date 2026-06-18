# ChargeOps

EV charging station booking & management platform for Vietnam — BSc (Hons) Computing Final Year
Project. ChargeOps connects independent EV charging station owners with EV drivers: drivers discover
stations, pre-book time slots, pay upfront, and check in by QR; owners manage stations, chargers,
slots and pricing; admins approve stations, provision chargers, and monitor the platform.

This is a **monorepo** — all client apps, the backend, design assets, and documentation live here.

## Structure

```
chargeops/
  chargeops-driver-mobile/   # Driver app — Expo / React Native (active)
  chargeops-owner-web/       # Station-owner app — planned
  chargeops-admin-web/       # Admin panel — Next.js, planned
  backend/                   # Spring Boot REST API + PostgreSQL — planned
  designs/                   # Visily screen exports (visual reference)
  documents/                 # SRS and project documents
  DESIGN_SYSTEM.md           # Shared design tokens & component vocabulary (source of truth)
```

Each app is **self-contained** (its own `package.json` / `node_modules`). Shared visual rules live in
[`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md); the authoritative behavior spec is the SRS in
[`documents/`](documents/).

## Tech stack (per SRS)

| Part | Stack |
|---|---|
| Driver & Owner clients | React Native (Expo) — mobile (iOS/Android) |
| Admin client | React / Next.js — web |
| Backend | Java 17 + Spring Boot 3.x, layered (Controller → Service → Repository) |
| Database | PostgreSQL + PostGIS |
| Auth | JWT access + refresh tokens, role-based (DRIVER / OWNER / ADMIN) |
| Payments | VNPay / MoMo / ZaloPay (sandbox only) |
| Maps | Google Maps API (OpenStreetMap fallback) |

## Driver app — getting started

> The driver app is pinned to **Expo SDK 54** (target device Expo Go supports SDK 54). Do not upgrade
> Expo. See [`chargeops-driver-mobile/CLAUDE.md`](chargeops-driver-mobile/CLAUDE.md).

```bash
cd chargeops-driver-mobile
npm install
npm start          # scan the QR in Expo Go (SDK 54)
```

Architecture rule across all clients: **UI never calls data directly — everything flows through a
service layer** (mock now, real REST later), and **styling uses design tokens only** (no hardcoded
colors/spacing).

## Author

Pham Duc Thang — 001407356 — BSc (Hons) Computing, 2024–2025.
