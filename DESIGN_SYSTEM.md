# ChargeOps — Shared Design System

Single source of truth for visual design across all ChargeOps apps (driver, owner, admin).
Derived from the Visily screen exports in `designs/` and `../visily-multiscreens (light/dark theme)/`.

> **Rule for all apps:** never hardcode colors, spacing, radii, or font sizes in components/screens.
> Always reference the tokens below (in code, via each app's `theme/` module).

---

## 1. Brand & personality

Clean, minimal, eco-green, fintech-grade trust (the app handles payments).
Generous whitespace, rounded cards, pill-shaped status badges, compact sans-serif type,
a single confident emerald accent. Both **light** and **dark** themes are supported
(the Visily set ships both) — design tokens must be theme-aware.

App header pattern (mobile): screen title + a small uppercase **role label** beneath it
(`TÀI XẾ` driver / `CHỦ TRẠM` owner), with a leading back chevron and/or trailing kebab.

---

## 2. Color tokens

### Brand / primary
| Token | Light | Notes |
|---|---|---|
| `primary` | `#10B981` | emerald — buttons, active tab, selected segment, links |
| `primaryDark` | `#059669` | pressed states, price/emphasis text |
| `primaryLight` | `#34D399` | gradients, subtle accents |
| `primarySoft` | `#D1FAE5` | tinted chip/badge backgrounds, info cards |

### Status (semantic)
| Token | Hex | Used for |
|---|---|---|
| `success` | `#10B981` | "Sẵn sàng", "Online", available, confirmed |
| `warning` | `#F59E0B` | "Bảo trì / Maintenance", "Tạm khóa" |
| `error` | `#EF4444` | "Hết chỗ", errors, destructive (delete) |
| `info` | `#3B82F6` | "Đang sạc" (in-use) badge |

> Status badges are **pill-shaped** (full radius), small caption text, tinted background +
> solid text, OR solid fill + white text (e.g. blue "Đang sạc", red "Hết chỗ").

### Neutrals — Light theme
| Token | Hex | Used for |
|---|---|---|
| `background` | `#FFFFFF` | screen background |
| `surface` | `#FFFFFF` | cards |
| `surfaceAlt` | `#F9FAFB` | section/strip backgrounds, inputs |
| `border` | `#E5E7EB` | card borders, dividers |
| `textStrong` | `#111827` | titles, headings |
| `textBody` | `#374151` | body text |
| `textMuted` | `#6B7280` | captions, secondary, inactive tab |
| `textInverse` | `#FFFFFF` | text on primary/dark surfaces |

### Neutrals — Dark theme
| Token | Hex | Used for |
|---|---|---|
| `background` | `#0B0F0E` | screen background (near-black, faint green tint) |
| `surface` | `#161B1A` | elevated cards |
| `surfaceAlt` | `#1F2625` | inputs, strips |
| `border` | `#2A312F` | borders/dividers |
| `textStrong` | `#F9FAFB` | titles |
| `textBody` | `#E5E7EB` | body |
| `textMuted` | `#9CA3AF` | captions/secondary |

> Primary emerald, prices, and semantic colors stay the same hue in dark mode; only neutrals flip.

---

## 3. Spacing scale (px)

`xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32`

- Screen edge padding: `lg` (16).
- Gap between stacked cards/sections: `lg`–`xl`.
- Inside a card: `lg` padding, `sm`–`md` between rows.

## 4. Radius

`sm 8 · md 12 (buttons, inputs) · lg 16 (cards) · full 999 (pills/badges/avatars)`

## 5. Typography

Compact sans-serif (system default: SF Pro / Roboto).

| Role | Size | Weight | Used for |
|---|---|---|---|
| `display` | 28 | bold (700) | large screen headlines (splash, auth screens) |
| `title` | 24 | bold (700) | screen titles ("Chào mừng trở lại", "Bản đồ") |
| `heading` | 18 | semibold (600) | section headers, list item names |
| `body` | 14 | regular/medium | body, addresses, labels |
| `caption` | 12 | regular | metadata, tab labels, badge text, helper text |

- Each font size has a matching `lineHeights` token (`display` 36 · `title` 32 · `heading` 24 ·
  `body` 20 · `caption` 16). **Never hardcode `fontSize`/`lineHeight`** — always use a token.
- **Prices** are rendered in `primaryDark` green, semibold (e.g. `3.850đ/kWh`, `45.000đ`).
- KPI numbers are oversized + bold (dashboard stats).

## 6. Elevation

Cards: 1px `border` + very subtle shadow (`shadowOpacity ~0.05`, `elevation 2`). Minimal, flat-ish.

---

## 7. Core components (shared vocabulary)

| Component | Description |
|---|---|
| **AppButton** | Full-width, 48px tall, radius `md`. Primary = emerald fill + white text; Secondary = white/transparent + emerald border/text. Often paired (Hủy / Lưu). May carry a trailing icon (`Chọn khung giờ ›`). |
| **Card** | Rounded `lg` surface, border + subtle shadow, `lg` padding. The atomic container for stations, chargers, slots, bookings, KPIs. |
| **StatusBadge** | Pill, caption text. Variants map to semantic colors (available/in-use/maintenance/full). |
| **Chip / Filter** | Pill toggle (e.g. `Tất cả`, `Sạc nhanh (DC)`, `Đang mở`, `Giá rẻ`). Active = emerald fill + white. |
| **SegmentedControl** | Pill group with one active segment in emerald (auth phone/email; slot duration 30m/60m/120m). |
| **SearchBar** | Rounded `surfaceAlt` field, leading magnifier, trailing filter icon. |
| **ListRow** | Icon/thumbnail + title + meta + trailing value/chevron. Used for stations, chargers, slots. |
| **InfoCard** | `primarySoft` tinted card with leading icon — tips, refund policy, security notices. |
| **BottomTabBar** (mobile) | Icon + caption per tab; active = emerald, inactive = `textMuted`. |
| **Toggle/Switch** | Emerald when on (owner rules: auto-lock slot, night discount). |

---

## 8. Iconography

Line icons (Ionicons-style), ~24px, inherit text/accent color. Lightning bolt ⚡ = brand/charging motif.

---

## 9. Localization & formatting (i18n)

- **Default UI language: Vietnamese (`vi`).** English (`en`) is a supported secondary language.
  Code, identifiers, and comments stay in English.
- **All user-facing strings go through i18n** (`react-i18next`) — never hardcode display strings in
  screens/components. Use the `useTranslation()` hook and `t('namespace.key')`.
- Keys are namespaced by screen/area (`welcome.title`, `common.terms`). Every key must exist in **both**
  locale files. Add new strings to all locales together.
- The app detects the device locale on launch and falls back to `vi` if unsupported. Runtime switch:
  `i18n.changeLanguage('en')`.
- Currency: Vietnamese đồng, grouped with `.` thousands separators — `3.850đ`, `45.000đ`, `1.250k`.
- Phone: `+84` country prefix default.
- Dates/times: 24h (`14:00 - 15:00`), Vietnamese weekday abbreviations (`Th 2`…`Th 7`, CN).
- Implementation per app: an `src/i18n/` module (i18next config + `locales/{vi,en}.json`), initialized
  once in `App.tsx`. See the driver app's `CLAUDE.md` for the concrete setup.

---

## 10. Per-app theme implementation

Each app keeps its own `theme/` module that exports these exact tokens
(`colors`, `spacing`, `radius`, `typography`) so imports stay local and clean
(`@/theme`), but the **values must match this document**. When this doc changes,
update every app's `theme/` to match.
