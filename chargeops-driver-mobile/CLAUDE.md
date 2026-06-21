@AGENTS.md

# ChargeOps Driver App — Agent Context

You are working on the **ChargeOps Driver mobile app**: the app an EV driver in Vietnam uses to
find charging stations, book a time slot, pay, check in by QR, and view history. ChargeOps is an
EV charging station booking & management platform (final-year project). This is one of three apps;
**only the driver app is in scope right now** (owner/admin are deferred).

## User & language
- **End user:** EV driver (role label shown in headers as `TÀI XẾ`).
- **UI language: Vietnamese.** All user-facing labels are in Vietnamese.
- **Code, identifiers, comments, commits: English.**

## Tech stack (pinned — do not change casually)
- **Expo SDK 54** — `expo` pinned to **exactly `54.0.2`**. **Do NOT upgrade Expo:** the target
  iPhone's Expo Go only supports SDK 54. `expo` is locked via `package.json` →
  `expo.install.exclude: ["expo"]`, so `expo install`/`expo-doctor` won't bump it.
- **React Native 0.81.5**, **React 19.1.0**, **TypeScript ~5.9** (strict).
- **React Navigation 7**: native-stack + bottom-tabs. `react-native-screens ~4.16`,
  `react-native-safe-area-context ~5.6`.
- Icons: `@expo/vector-icons` v15 (Ionicons); requires the `expo-font` peer (already installed).
- Path alias **`@/` → `src/`** (configured in `babel.config.js` via `babel-plugin-module-resolver`
  and in `tsconfig.json` `paths`). Always import as `@/theme`, `@/services/...`, never deep relative.
- Expo changed a lot recently — **read the versioned docs at https://docs.expo.dev/versions/v54.0.0/
  before adding native modules or config** (see `AGENTS.md`). When adding Expo packages use
  `npx expo install <pkg>` so versions stay SDK-54-compatible.

## THE core architectural rule (non-negotiable)
**UI never touches data directly. All data flows through the service layer (`src/services`).**
- Screens/components call async functions in `stationService.ts` / `bookingService.ts`.
- Services currently return **mock data** (`src/mock/*`). Later, only the *internals* of each
  service change to call the real REST API — **function signatures and all calling UI stay identical**.
- Every service function is `async` (even returning mock) so swapping in `fetch()` later is invisible to the UI.

## Second rule: design tokens only
**Never hardcode colors, spacing, radii, or font sizes.** Import from `@/theme`
(`colors`, `spacing`, `radius`, `typography`). The token values mirror the shared design system at
[`../DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) — that file is the source of truth for the whole platform.
Font sizes use the `fontSizes` scale (`display` 28 · `title` 24 · `heading` 18 · `body` 14 ·
`caption` 12) with matching `lineHeights` — use `fontSizes.display`/`lineHeights.display` for big
screen headlines (splash, auth), not raw numbers.

## Third rule: all UI strings go through i18n
**Never hardcode user-facing text.** Use `react-i18next`: `const { t } = useTranslation();` then
`t('namespace.key')`. Strings live in `src/i18n/locales/{vi,en}.json`, namespaced by screen/area
(`welcome.title`, `common.terms`, `nav.*`). The app **always boots in Vietnamese (`vi`)** — the device
locale is intentionally ignored on launch (ChargeOps is built for Vietnamese drivers); `en` is supported
and the user can switch at runtime via `<LanguageSwitcher />`. Add every new key to **both** locale files.
- **All screens + navigation titles are migrated** — follow the existing pattern; don't reintroduce literals.
- **Pinned versions:** `i18next@24` + `react-i18next@15` (newer majors break Metro's resolver — do not upgrade).
- **Navigation titles** (`BottomTabs`, `RootNavigator`) call `t()` inside the component so they re-render on language change.
- **Service-layer errors** are language-agnostic: `authService` throws stable **codes** (`EMAIL_EXISTS`,
  `INVALID_CREDENTIALS`, `INVALID_OTP`); screens map them with `authErrorMessage(t, e)` (`@/i18n/authErrors`)
  → `auth.errors.<CODE>`. Follow this pattern for future services.
- **Language switch:** `<LanguageSwitcher />` (`@/components`) calls `i18n.changeLanguage(...)`. It's on the
  Welcome screen (pre-login) and Profile (post-login). Choice is in-memory only — **persistence
  (e.g. expo-secure-store) is a future step** so it resets to the device locale on relaunch.

## Folder structure
```
src/
  screens/      # one component per screen (see screen list below)
  components/   # reusable UI — AppButton, Card, TextField, PasswordField, PhoneField, Checkbox, OtpInput, LanguageSwitcher
  navigation/   # RootNavigator (stack), BottomTabs (5 tabs), types.ts (param lists)
  services/     # DATA LAYER — stationService, bookingService, authService (mock now, REST later)
  mock/         # fake data — stations.mock.ts, bookings.mock.ts, users.mock.ts
  context/      # AuthContext (in-memory session + signIn/signOut, useAuth hook)
  i18n/         # i18next config + locales/{vi,en}.json (UI strings)
  theme/        # design tokens — colors, spacing, typography, index (barrel)
  types/        # domain types mirroring the DB schema
App.tsx         # imports '@/i18n' (init) > SafeAreaProvider > AuthProvider > RootNavigator
```

## Navigation map
- **Auth state drives the stack** (`RootNavigator` reads `useAuth().session`): signed out → auth
  stack; signed in → app stack. Screens never imperatively jump to/from the tabs — they call
  `signIn`/`signOut` and the stack swaps.
- **Auth flow (signed out):** `Welcome` → `Login` (email + password) → `Register` → `OtpVerification`
  → *(sign in)* → app. Login ↔ Register cross-link.
- **Bottom tabs (5):** `StationList` (Tìm trạm) · `Map` (Bản đồ) · `Bookings` (Đặt chỗ) · `BookingHistory` (Lịch sử) · `Profile` (Hồ sơ).
- **Booking flow (stack, over tabs):** `StationList`/`Map` → `StationDetail` → `SlotPicker` → `QRCheckIn`.
- Route param lists live in `src/navigation/types.ts`; always type `useNavigation`/`useRoute` against them.

## Screens (current = placeholder; design reference in `../designs/`)
| Screen | Tab/flow | Purpose | Design ref |
|---|---|---|---|
| `WelcomeScreen` | auth | Splash / onboarding intro | `visily-splash-onboarding.jpg` |
| `LoginScreen` | auth | Email + password login (FR01); links to Register | `visily-authentication.jpg` |
| `RegisterScreen` | auth | Driver sign-up: name, email, +84 phone, password, confirm, terms. role fixed to DRIVER | `visily-authentication.jpg` |
| `OtpVerificationScreen` | auth | 6-digit OTP → auto-login. **Addition beyond SRS FR01** (mock code `123456`) | — |
| `StationListScreen` | Tìm trạm | Search + nearby station cards (name, rating, address, available ports, distance). **Also the service-layer verification screen.** | `visily-driver-home.jpg` |
| `MapScreen` | Bản đồ | Map of stations (Google Maps later) | — |
| `BookingsScreen` | Đặt chỗ | Upcoming/active bookings | `visily-driver-booking-detail.jpg` |
| `BookingHistoryScreen` | Lịch sử | Past bookings with status badges | `visily-booking-history.jpg` |
| `ProfileScreen` | Hồ sơ | Account & settings | `visily-profile-&-settings.jpg` |
| `StationDetailScreen` | flow | Station photos, amenities, refund policy, charger list, "Chọn khung giờ" CTA | `visily-driver-station-detail.jpg` |
| `SlotPickerScreen` | flow | Date strip + slot grid (fixed per-slot prices), refund policy | `visily-slot-picker.jpg` |
| `QRCheckInScreen` | flow | QR scan → check-in success → start charging | `visily-qr-check-in.jpg`, `visily-charging-session.jpg` |

Additional designs to build later: `visily-booking-confirmation.jpg`, `visily-booking-success.jpg`,
`visily-cancellation-confirmation.jpg`, `visily-charging-session.jpg`.

## Domain model (`src/types/index.ts`)
`Station`, `Charger`, `Slot`, `Booking` plus enums `ConnectorType` (CCS2/CHADEMO/TYPE2/GBT),
`ChargerStatus` (AVAILABLE/IN_USE/DISABLED/MAINTENANCE), `BookingStatus`
(PENDING/CONFIRMED/CHECKED_IN/COMPLETED/CANCELLED/NO_SHOW).
Auth/account: `User` (mirrors SRS User entity), `UserRole`, `UserStatus`, `AuthTokens`,
`AuthSession`, `RegisterRequest`, `LoginRequest`. The client sends a `password`; it never handles
`password_hash` (backend bcrypt per FR01). Role is `DRIVER` and immutable in this app (BR-ACC-01).

> **The SRS exists**: `../documents/ChargeOps_SRS_v4_2.docx` (FR01 auth, FR05–FR09 booking, FR08
> refund tiers, Section 9 business rules BR-*, Section 7 data model). Treat it as authoritative for
> behavior; treat the Visily designs as authoritative for visuals.

### Business rules (cross-check the SRS at `../documents/ChargeOps_SRS_v4_2.docx`)
- **Pricing is fixed per slot.** The owner sets a default `đ/kWh` rate per charger plus time-band
  overrides (peak hours cost more). The system **snapshots a fixed price onto each `Slot`**
  (e.g. 45.000đ, 55.000đ). **The driver UI displays `Slot.price` as-is and must NEVER compute price
  from kWh.** The `đ/kWh` figure on station/charger views is an informational rate label only.
- **Slot status** maps to availability: `AVAILABLE` (Có sẵn), `BOOKED` (Đã đặt), `DISABLED` (Tạm khóa).
- **Refund/cancellation** is time-tiered (e.g. 100% if cancelled early, 50% within a window, 0% if too
  late / no-show). Copy varies per screen — treat exact thresholds as SRS-defined.
- **Auto no-show:** a slot auto-locks ~15 min after start if the driver doesn't check in → `NO_SHOW`.
- **Check-in** is by QR at the station; success → option to start charging; charging auto-stops when full.
- **Ratings:** stations show an average star rating (`Station.rating`, `reviewCount`). Display only;
  driver-side rating submission is not yet specified.

## Formatting
- Currency: VND with `.` thousands separators — `3.850đ`, `45.000đ`. Phone prefix `+84`. 24h times.

## Out of scope for the skeleton
Real Google Maps, real QR camera/GPS, real REST API, auth/Keycloak, heavy UI libs, detailed screen UI.
Keep screens as placeholders until asked; build the structure, tokens, and data flow first.

## Commands
- `npm start` — Expo dev server (scan QR in Expo Go).
- `npx tsc --noEmit` — type-check. Keep it green.

## Decisions log (differs from the original scaffold prompt)
- Driver bottom nav is **5 tabs** (design wins over the prompt's 3).
- **Ratings are included** on `Station` (design wins over the prompt's "no rating").
- Owner & admin apps are **deferred**; this repo is driver-only for now.
