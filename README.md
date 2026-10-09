# ChargeOps — Frontend Ecosystem

> **EV Charging Station Booking & Network Operations Platform for Vietnam**  
> *BSc (Hons) Computing Final Year Project*

ChargeOps is an end-to-end electric vehicle (EV) charging infrastructure ecosystem connecting independent charging station operators with EV drivers across Vietnam. The frontend monorepo delivers an intuitive mobile application for EV drivers, an enterprise multi-role operations console for station owners and administrators, a public marketing portal, a customized Keycloak identity console, and shared design systems.

---

## 🏛️ System Architecture

The ChargeOps frontend ecosystem is organized as a monorepo communicating with the Spring Boot backend via strictly typed contracts:

| Application / Package | Role & Tech Stack | Target Audience |
|---|---|---|
| **`chargeops-web`** | **Operator & Admin Web Console**<br/>React 19, Vite, Tailwind CSS v4, TanStack Query, React Router v7, React i18next | Station Owners, Platform Admins, Station Staff |
| **`chargeops-driver-mobile`** | **EV Driver Mobile Application**<br/>React Native, Expo SDK 54, React Navigation 7, i18next | EV Drivers (iOS & Android) |
| **`chargeops-marketing`** | **Public Marketing & Acquisition Portal**<br/>Next.js App Router, Tailwind CSS, Lucide Icons | Prospective Hosts & Partners |
| **`chargeops-keycloak`** | **Identity & Account Management Console**<br/>Keycloak 26.0.8, Custom FreeMarker Themes | All Authenticated Users |
| **`packages/api`** | **Typed Domain Contracts & Client SDK**<br/>TypeScript, Axios-based HTTP client, high-fidelity mock engine | Shared across web apps |
| **`packages/ui`** | **Shared Component Library & Design Tokens**<br/>Tailwind tokens, badges, toasts, responsive layouts | Shared across web apps |

```
chargeops-frontend/
├── chargeops-web/             # Operator & Admin Web Console (React 19 + Vite)
│   ├── apps/web/              # Role-routed SPA (Owner, Admin, Staff consoles)
│   └── packages/
│       ├── api/               # Typed contracts, REST client, high-fidelity mock services
│       └── ui/                # UI kit, semantic badges, interactive toast stack
├── chargeops-driver-mobile/   # EV Driver Mobile App (React Native / Expo SDK 54)
├── chargeops-marketing/       # Public Marketing & Subscription Portal (Next.js)
├── chargeops-keycloak/        # Keycloak FreeMarker auth themes & account console
├── DESIGN_SYSTEM.md           # Master design token vocabulary & aesthetic guidelines
└── README.md                  # Ecosystem overview & developer documentation
```

---

## ✨ Key Features & User Roles

### ⚡ 1. EV Drivers (`chargeops-driver-mobile`)
- **Map & Spatial Station Discovery**: Interactive map search with real-time GPS location tracking, distance radius filters, and connector compatibility filters (CCS2, Type 2, GB/T, CHAdeMO).
- **Time-Slot Reservation Engine (v4.9)**: Upfront fixed-package booking with 10-minute hold lock to eliminate charging queue uncertainty.
- **BKG-067 Cancellation & Refund Transparency**:
  - Clear in-app display of the 10-minute Grace Window from payment confirmation (100% refund).
  - Explicit notification of 0% refund on voluntary cancellation post-grace or no-show.
  - 100% full package refund guarantee on substantiated station hardware failure.
- **QR Code Check-in**: On-site connector QR validation adhering to the strict check-in window (`startAt` to `endAt - 15m`).
- **Live Charging Session Monitoring**: Simulated telemetry tracking delivered energy (kWh), charging duration, battery SoC, and instant digital receipts.
- **Bilingual Legal Policies**: In-app viewer for Terms of Service and Privacy Policy supporting Vietnamese and English.

### 🏢 2. Station Owners & Operators (`chargeops-web`)
- **Multi-Station Lifecycle Management**: Station registration, geo-pinpointing, amenities configuration, and operational status monitoring.
- **Hardware Telemetry & Charger Provisioning**: Real-time monitoring of charge points and individual connectors (Available, Occupied, Faulted, Maintenance).
- **Dynamic Time-of-Use (TOU) Pricing**: Flexible rate card configuration with peak, off-peak, and shoulder pricing rules.
- **Financial Ledger & Refund Tracking**: Comprehensive double-entry accounting tracking booking revenues, cancellation refunds, and net station earnings.
- **AI Policy Assistant with History Recovery (FR15 / BKG-067)**:
  - Natural-language Q&A grounded on official platform policy documents via Dify RAG.
  - Interactive sidebar displaying historical conversation sessions with cursor-based pagination.
  - Inline source citations drawer revealing exact document excerpts and relevance scores.
  - Daily query quota countdown counter and intelligent rate-limit protection.
  - Full GitHub-flavored Markdown rendering with code blocks, tables, and alerts (`react-markdown`, `remark-gfm`).
- **Support Ticket Desk**: Direct communication channel for handling driver incidents and dispute resolutions.

### 🛡️ 3. Platform Administrators (`chargeops-web`)
- **Station Auditing & Approval Workflows**: Two-step station verification with document auditing, prerequisite checks, and rejection reason logging.
- **Operator License Governance**: Issuance, renewal, suspension, and revocation of station operator licenses with immutable audit event logging.
- **Driver Eligibility Engine (`isStationDriverEligible`)**: Smart business evaluator enforcing that only physically approved and actively licensed stations receive driver bookings.
- **Dispute Refund Arbitration**: Authoritative review of escalated driver refund requests with telemetry verification.
- **Policy Knowledge Base Management**: Centralized management of operational and legal markdown documents with suffix-agnostic category matching and bilingual support.

### 👷 4. Station Staff (`chargeops-web`)
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
- **High-Fidelity Mock & Real API Parity**: Zero-friction switching between local mock datasets and the live Spring Boot API via environment configuration.
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

---

### 2. EV Driver Mobile App (`chargeops-driver-mobile`)

```bash
cd chargeops-driver-mobile
npm install
npm start
```

- Scan the generated QR code using **Expo Go (SDK 54)** on iOS or Android, or press `a` for Android Emulator / `w` for Web preview.

---

### 3. Marketing Portal (`chargeops-marketing`)

```bash
cd chargeops-marketing
npm install
npm run dev
```

- Open [http://localhost:3000](http://localhost:3000) to view the public marketing and subscription portal.

---

### 4. Running Unit & Adapter Tests

Run the test suite for driver adapter and policy validation:
```bash
cd chargeops-driver-mobile
npx tsx scripts/test-adapter.ts
```

Check TypeScript types across the web workspace:
```bash
cd chargeops-web/apps/web
npx tsc --noEmit
```

---

## 👨‍💻 Author

**Pham Duc Thang**  
*BSc (Hons) Computing — Final Year Project*  
ID: 001407356  
Hanoi, Vietnam
