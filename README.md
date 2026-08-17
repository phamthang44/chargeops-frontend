# ChargeOps — Frontend Ecosystem

> **EV Charging Station Booking & Network Operations Platform for Vietnam**  
> *BSc (Hons) Computing Final Year Project*

ChargeOps is an end-to-end electric vehicle (EV) charging infrastructure platform that connects independent charging station operators with EV drivers across Vietnam. The platform enables drivers to discover nearby stations, reserve time slots with upfront payment, and check in via connector QR codes, while empowering station owners and platform administrators with comprehensive lifecycle management, dynamic pricing, charger telemetry, and subscription licensing.

---

## 🏛️ System Architecture

ChargeOps is organized into two primary repositories:

| Repository | Role | Technology Stack |
|---|---|---|
| **`chargeops-frontend`** *(this monorepo)* | Driver mobile app, operator/admin web console, marketing portal, Keycloak UI, and shared design system | React Native (Expo), React 19 / Vite, Next.js, FreeMarker, Tailwind CSS |
| **`chargeops-backend`** *(separate repository)* | REST API services, transactional workflows, PostGIS spatial queries, security & database layer | Java 21 / Spring Boot 3.x, PostgreSQL + PostGIS, Keycloak IAM |

All client applications communicate with the backend exclusively via **typed REST endpoints**. During development, the frontend client service layer seamlessly switches between high-fidelity mock services and the live Spring Boot API.

```
chargeops-frontend/
├── chargeops-web/             # Operator & Admin Web Console (React 19 + Vite + Tailwind CSS)
│   ├── apps/web/              # Single role-routed SPA (Admin / Owner / Staff)
│   └── packages/
│       ├── api/               # Typed domain contracts, status evaluators, REST & mock services
│       └── ui/                # Shared component library, design tokens, badges & toast system
├── chargeops-driver-mobile/   # EV Driver Mobile App (React Native / Expo SDK 54)
├── chargeops-marketing/       # Public Marketing & Subscription Portal (Next.js App Router)
├── chargeops-keycloak/        # Custom Keycloak FreeMarker authentication & Account Console
└── DESIGN_SYSTEM.md           # Master design token vocabulary & UI guidelines
```

---

## ✨ Key Features & User Roles

### ⚡ 1. EV Drivers (`chargeops-driver-mobile`)
- **Map & Station Discovery**: Interactive map search with real-time location tracking, radius filters, and connector type matching (CCS2, Type 2, GB/T, CHAdeMO).
- **Time-Slot Reservation**: Upfront booking engine with slot reservation locks to eliminate charging station queue anxiety.
- **Escrow Payment Integration**: Support for Vietnamese payment channels (VNPay, MoMo, ZaloPay sandbox).
- **Static QR Code Check-in**: Scan connector-specific QR codes on arrival to validate reservation and initiate charging.
- **Live Session Monitoring**: Real-time energy delivery (kWh), charging duration, battery percentage (SoC), and instant receipt generation.

### 🏢 2. Station Owners / Operators (`chargeops-web`)
- **Station Registration & Lifecycle**: Self-service multi-station onboarding with document uploads, geolocation pinpointing, and timeline history.
- **Driver Eligibility Evaluation (`isStationDriverEligible`)**: Smart business indicator evaluating station status (`ACTIVE`) alongside real-time License validity to guarantee only compliant stations receive new driver bookings.
- **Time-of-Use (TOU) & Dynamic Pricing**: Flexible rate card configuration with peak, off-peak, and shoulder pricing rules.
- **Hardware & Connector Management**: Real-time monitoring of charge points, power output, connectivity status (Online / Busy / Faulted), and amenities.
- **Subscription License Tracking**: Self-service tracking of operator licenses (Monthly / Yearly), validity countdowns, and renewal alerts.
- **Revenue Analytics & Operations**: Granular transaction logs, daily revenue trends, driver booking schedules, and support ticket desk.

### 🛡️ 3. Platform Administrators (`chargeops-web`)
- **Station Approval Workflows**: Two-step station verification with document auditing, prerequisite checks, and rejection reason logging.
- **License Governance**: Official issuance, renewal, suspension, reactivation, and cancellation of operator licenses with immutable audit event logging.
- **Charger Provisioning**: Automated QR label generator, hardware connector mapping, and serial allocation.
- **Network Health & Analytics**: Platform-wide transaction auditing, revenue distribution metrics, and operational KPI overviews.
- **Policy Knowledge Base (RAG)**: Administrative management of operational policies powering the integrated AI assistant.

### 🌐 4. Marketing & Public Portal (`chargeops-marketing`)
- **Operator Acquisition**: High-converting landing page highlighting platform value proposition and unit economics for independent charging hosts.
- **Subscription Tiers**: Transparent pricing overview for operator licenses (Standard Monthly: 500,000 VND / Professional Yearly: 5,000,000 VND).
- **Interactive Knowledge Hub**: Responsive feature breakdowns, network coverage statistics, and FAQ.

---

## 🎨 Design System & Engineering Standards

- **High-Density Aesthetic**: Custom Tailwind tokens adhering to the design specifications in [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) (sleek dark/light surfaces, curated semantic colors, glassmorphism, micro-animations).
- **Strict Domain Decoupling**: UI components never fetch data directly; all communication passes through `@chargeops/api` services.
- **Driver Eligibility Engine**: Strict algorithmic separation between physical station approval status and operational subscription license validity.
- **Full Localization (i18n)**: Comprehensive Vietnamese and English translations with standard **UTC+7 (Vietnam Time)** date and time formatting.
- **Resilient Toast & Feedback Stack**: Interactive, pause-on-hover notifications with dedicated contextual icons and customizable durations.

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
Open [http://localhost:5173](http://localhost:5173) in your browser.  
Use the header role switcher to navigate between **Admin Console**, **Owner Console**, and **Staff Console**.

---

### 2. EV Driver Mobile App (`chargeops-driver-mobile`)
```bash
cd chargeops-driver-mobile
npm install
npm start
```
Scan the generated QR code using **Expo Go (SDK 54)** on an iOS or Android device.

---

### 3. Marketing Portal (`chargeops-marketing`)
```bash
cd chargeops-marketing
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to explore the public landing and subscription pricing site.

---

## 👨‍💻 Author

**Pham Duc Thang**  
*BSc (Hons) Computing — Final Year Project*  
ID: 001407356  
Class: GCS220023  
