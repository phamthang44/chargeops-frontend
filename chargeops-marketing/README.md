# ChargeOps — Marketing site

Public **discovery + trust layer** for the ChargeOps EV-charging platform. The driver
product lives on mobile (Expo); this Next.js site is what web searchers find first, so it
must be server-rendered and indexable.

- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS.
- **Language:** Vietnamese-first (matches the app's default locale).
- **Design:** mirrors `../DESIGN_SYSTEM.md` — emerald palette, glass surfaces, the same
  bolt brand mark as the driver app.

## What it includes
- Driver landing: hero, problem→solution, 3-step how-it-works, **read-only station
  coverage** (the "do you cover my area?" bridge), features, download CTA.
- Owner band (`#doi-tac`) with a mailto lead capture — no self-serve onboarding by design.
- No-backend **waitlist** form (local success state) — does not fake a real account.
- SEO: per-page metadata, Open Graph, `sitemap.ts`, `robots.ts`, JSON-LD.

## Scope notes
- **No web auth / no booking on web.** Transactions stay in the mobile app; real auth is
  Keycloak (OIDC) on mobile. The web layer only builds trust and funnels to download.
- Station coverage data is illustrative mock data in `components/stations.ts`. Swap for a
  public read-only API endpoint later.
- To make the waitlist real, POST the email to a form service (Formspree/Resend) in
  `components/WaitlistForm.tsx`.

## Develop
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```
