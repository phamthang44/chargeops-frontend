# ChargeOps — Frontend Ecosystem

> **Enterprise EV Charging Infrastructure, Spatial Booking & Operations Platform for Vietnam**  
> *BSc (Hons) Computing Final Year Project*

ChargeOps is an end-to-end electric vehicle (EV) charging infrastructure ecosystem connecting independent charging station operators with EV drivers across Vietnam. The frontend monorepo delivers an intuitive mobile application for EV drivers, an enterprise multi-role operations console for station owners and administrators, a public marketing portal, a customized Keycloak identity console, and shared design systems.

---

## 🌐 Public Domain & Network Architecture Invariant

All web clients, mobile apps, Keycloak authentication realms, and OAuth callbacks operate exclusively over the single secure Public Domain:

```text
https://thang.tail704409.ts.net
```

> [!IMPORTANT]
> **Strict Domain Contract**:
> - **Canonical Public Origin**: All client-facing APIs, WebSocket/STOMP channels, and Keycloak issuer endpoints MUST point to `https://thang.tail704409.ts.net`.
> - **Internal Port 8088 Prohibition**: Port `8088` (`127.0.0.1:8088`) is strictly a local host listening port used by Nginx Gateway to receive incoming traffic forwarded from Tailscale Funnel (`443 -> 8088`). External clients, OAuth redirect URIs, and frontend configs must **NEVER** use `http://localhost:8088` or expose port 8088 directly.

---

## 🏛️ System Architecture & Monorepo Structure

The ChargeOps frontend ecosystem is organized as a unified monorepo communicating with the Spring Boot backend via strictly typed contracts:

| Application / Package | Role & Tech Stack | Target Audience |
|---|---|---|
| **`chargeops-web`** | **Operator & Admin Web Console**<br/>React 19, Vite, Tailwind CSS v4, TanStack Query, React Router v7, React i18next | Station Owners, Platform Admins, Station Staff |
| **`chargeops-driver-mobile`** | **EV Driver Mobile Application**<br/>React Native, Expo SDK 54, React Navigation 7, i18next | EV Drivers (iOS & Android) |
| **`chargeops-marketing`** | **Public Marketing & Acquisition Portal**<br/>Next.js App Router, Tailwind CSS, Lucide Icons | Prospective Hosts & Partners |
| **`chargeops-keycloak`** | **Identity & Account Management Console**<br/>Keycloak 26.0.8, Custom FreeMarker Themes | All Authenticated Users |
| **`packages/api`** | **Typed Domain Contracts & Client SDK**<br/>TypeScript, Axios-based HTTP client, high-fidelity mock engine | Shared across web apps |
| **`packages/ui`** | **Shared Component Library & Design Tokens**<br/>Tailwind tokens, semantic badges, toasts, responsive layouts | Shared across web apps |

```
chargeops-frontend/
├── chargeops-web/             # Operator & Admin Web Console (React 19 + Vite)
│   ├── apps/web/              # Role-routed SPA (Owner, Admin, Staff consoles)
│   │   ├── src/admin/         # Platform Admin features (User Management, Station Auditing, Action Queues)
│   │   ├── src/owner/         # Station Owner features (Station Management, Ledger, Rate Cards, AI Assistant)
│   │   ├── src/staff/         # Station Staff features (Checklists, Incident Reporting)
│   │   └── src/shared/        # Shared components, Support Desk, Ticket Inquiries
│   └── packages/
│       ├── api/               # Typed contracts, REST client, high-fidelity mock services
│       └── ui/                # UI kit, semantic badges, interactive toast stack
├── chargeops-driver-mobile/   # EV Driver Mobile App (React Native / Expo SDK 54)
│   ├── src/screens/           # Driver Discovery, Booking History, Active Session, Support
│   └── src/hooks/             # Hybrid STOMP + Smart Polling hooks (useBookingDetail, etc.)
├── chargeops-marketing/       # Public Marketing & Subscription Portal (Next.js)
├── chargeops-keycloak/        # Keycloak FreeMarker auth themes & account console
├── DESIGN_SYSTEM.md           # Master design token vocabulary & aesthetic guidelines
└── README.md                  # Ecosystem overview & developer documentation
```

---

## ✨ Key Features & User Roles

### ⚡ 1. EV Drivers (`chargeops-driver-mobile`)
- **Map & Spatial Station Discovery**: Interactive map search with real-time GPS location tracking, distance radius filters, and connector compatibility filters (CCS2, Type 2, GB/T, CHAdeMO).
- **Time-Slot Reservation Engine (v4.9)**: Upfront fixed-package booking with atomic 10-minute hold lock to eliminate charging queue uncertainty.
- **BKG-067 Cancellation & Refund Transparency**:
  - Clear in-app display of the 10-minute Grace Window from payment confirmation (100% refund).
  - Explicit notification of 0% refund on voluntary cancellation post-grace or no-show.
  - 100% full package refund guarantee on substantiated station hardware failure.
- **Hybrid Real-Time Refund & History Synchronization**:
  - WebSocket/STOMP private notification listener (`/user/queue/notifications`) for instant status updates.
  - **Adaptive Smart Polling** (2.5s cadence) automatically activated when a refund is in `PENDING` or `PROCESSING` state, stopping gracefully upon final resolution.
  - Screen focus auto-refresh (`useFocusEffect`) ensuring booking history is always up to date upon navigation.
- **QR Code Check-in**: On-site connector QR validation adhering to the strict check-in window (`startAt` to `endAt - 15m`).
- **Live Charging Session Monitoring**: Simulated telemetry tracking delivered energy (kWh), charging duration, battery SoC, and instant digital receipts.
- **Bilingual Legal Policies**: In-app viewer for Terms of Service and Privacy Policy supporting Vietnamese and English.

### 🏢 2. Station Owners & Operators (`chargeops-web`)
- **Dedicated Owner Dashboard V1 (DB-01)**: Real-time operational metrics, net realized earnings, connector availability gauges, and recent booking activity.
- **Multi-Station Lifecycle Management**: Station registration, geo-pinpointing, amenities configuration, and operational status monitoring.
- **Hardware Telemetry & Charger Provisioning**: Real-time monitoring of charge points and individual connectors (Available, Occupied, Faulted, Maintenance).
- **Dynamic Time-of-Use (TOU) Pricing**: Flexible rate card configuration with peak, off-peak, and shoulder pricing rules.
- **Exclusive Financial Ledger & Payout Tracking (BKG-063 / FE-20)**:
  - Multi-tenant double-entry accounting ledger tracking booking revenues, cancellation refund liabilities, and net station earnings.
  - *Strict authorization boundary*: Financial revenues belong exclusively to the station owner who operates the hardware.
- **AI Policy Assistant with History Recovery (FR15 / BKG-067)**:
  - Natural-language Q&A grounded on official platform policy documents via Dify RAG.
  - Interactive sidebar displaying historical conversation sessions with cursor-based pagination.
  - Inline source citations drawer revealing exact document excerpts and relevance scores.
  - Daily query quota countdown counter and intelligent rate-limit protection.
  - Full GitHub-flavored Markdown rendering with code blocks, tables, and alerts (`react-markdown`, `remark-gfm`).
- **Support Ticket Desk**: Direct communication channel for handling driver incidents and dispute resolutions.

### 🛡️ 3. Platform Administrators (`chargeops-web`)
- **Centralized User Management Module (UM-01 → UM-05)**:
  - Server-side paginated directory of all platform accounts with full-text search (name, email) and multi-attribute filtering by role (`DRIVER`, `STAFF`, `OWNER`, `ADMIN`) and status (`ACTIVE`, `SUSPENDED`).
  - **Account Suspension & Re-activation Modal**: Mandatory reason specification (5–500 characters) with full administrative audit logging.
  - **Privilege Safeguards**: Built-in protection preventing administrators from suspending their own active session or modifying other Admin/Owner accounts via standard actions.
  - **User Detail Drawer**: Deep-link support inquiry lookup redirecting directly to filtered support tickets (`/admin/tickets?search=...`).
- **Admin Role Dashboard V1 (DB-00 & DB-03) with Action Queues**:
  - Urgent Action Queues prioritizing critical tasks: Pending Station Approvals and High-Priority Dispute Tickets.
  - Platform User Overview metrics (Total Users, Drivers, Staff, Owners) with direct deep-links to filtered user management views.
  - *Clean Boundary Separation*: Legacy pages (Bookings, Transactions, Global Analytics) are formally `@deprecated` — Admins do not manage global commercial revenue; financial arbitration is strictly case-by-case within escalated support tickets.
- **Station Auditing & Approval Workflows**: Two-step station verification with document auditing, prerequisite checks, and rejection reason logging.
- **Operator License Governance**: Issuance, renewal, suspension, and revocation of station operator licenses with immutable audit event logging.
- **Driver Eligibility Engine (`isStationDriverEligible`)**: Smart business evaluator enforcing that only physically approved and actively licensed stations receive driver bookings.
- **Dispute Refund Arbitration**: Authoritative review of escalated driver refund requests with telemetry verification.
- **Policy Knowledge Base Management**: Centralized management of operational and legal markdown documents with suffix-agnostic category matching and bilingual support.

### 👷 4. Station Staff (`chargeops-web`)
- **Dedicated Staff Dashboard V1 (DB-02)**: Station-scoped overview of charger health, open inspections, and on-site alerts.
- **On-Site Operations**: Daily charger inspection checklists and technical fault logging.
- **Incident Evidence Logging**: Recording technical telemetry and station fault findings to assist dispute arbitration.

### 🌐 5. Marketing & Public Portal (`chargeops-marketing`)
- **Operator Acquisition**: High-converting marketing landing page highlighting unit economics and network benefits for prospective station hosts.
- **Transparent Subscription Tiers**: Clear pricing overview for operator licenses (Standard Monthly / Professional Yearly).
- **Interactive Knowledge Hub**: Responsive feature breakdowns, network coverage statistics, and FAQ.

---

## 🎨 Design System & Engineering Standards

- **High-Density Aesthetic**: Custom Tailwind tokens adhering to [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) (sleek dark/light surfaces, curated semantic colors, glassmorphism, micro-animations).
- **Strict Domain Decoupling**: UI components never make direct HTTP calls; all interactions pass through `@chargeops/api` services.
- **High-Fidelity Mock & Real API Parity**: Zero-friction switching between local mock datasets and the live Spring Boot API via environment configuration (`VITE_USE_MOCK_API=false`).
- **Full Localization (i18n)**: Comprehensive Vietnamese and English translations with standardized **UTC+7 (Vietnam Time)** date and time formatting.
- **Real-Time Responsiveness**: WebSocket/STOMP private notification hint queues (`/user/queue/notifications`) keeping client state synchronized without aggressive polling.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Expo Go** *(for mobile development)*: Compatible with Expo SDK 54

---

### 1. Operator & Admin Web Console (`chargeops-web`)

```bash
cd chargeops-web
npm install
npm run dev
```

- Open [http://localhost:5173](http://localhost:5173) in your browser.  
- Switch roles dynamically in the top navigation bar between **Station Owner**, **Platform Admin**, and **Station Staff**.
- Connects to backend API at `https://thang.tail704409.ts.net/api/v1` (or local proxy in `.env`).

---

### 2. EV Driver Mobile App (`chargeops-driver-mobile`)

```bash
cd chargeops-driver-mobile
npm install
npm start
```

- Scan the generated QR code using **Expo Go (SDK 54)** on iOS or Android, or press `a` for Android Emulator / `w` for Web preview.
- Configured with `EXPO_PUBLIC_API_URL=https://thang.tail704409.ts.net/api/v1`.

---

### 3. Marketing Portal (`chargeops-marketing`)

```bash
cd chargeops-marketing
npm install
npm run dev
```

- Open [http://localhost:3000](http://localhost:3000) to view the public marketing and subscription portal.

---

### 4. Code Quality & Test Verification

Run driver adapter and business rule unit tests:
```bash
cd chargeops-driver-mobile
npx tsx scripts/test-adapter.ts
```

Check TypeScript types across the web workspace:
```bash
cd chargeops-web/apps/web
npx tsc --noEmit
```

Analyze codebase call graphs and symbols:
```bash
npx gitnexus analyze
```

---

## 👨‍💻 Author

**Pham Duc Thang**  
*BSc (Hons) Computing — Final Year Project*  
ID: 001407356  
Hanoi, Vietnam
