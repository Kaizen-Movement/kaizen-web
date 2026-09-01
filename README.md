# Kaizen Subliminals

Phase 1 scaffold: Next.js 14 (App Router) + TypeScript + Tailwind + Supabase.
See `KAIZEN_PROJECT_BRIEF.md` (in the parent handoff doc) for the full 8-phase plan.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in values — see brief doc for where each one comes from
npm run dev
```

## What's implemented (Phase 1)

- Homepage reads live data from Supabase: `categories`, `products` (published only),
  `homepage_content` (hero + featured panel copy, editable later from the admin).
- Design system: dark void/charcoal backgrounds, burgundy/crimson/royal-blue/gold
  palette, Fraunces + Inter + IBM Plex Mono type stack, a single signature "seal"
  mark (concentric rings) used as logo + hero ambient graphic + empty-state icon.
- Sections: fixed header, hero, featured panel + grid, category-tab-controlled
  product strip, footer. All original layout/content — no clothing, no
  waveform/audio-preview visuals per brand brief.
- Product artwork is intentionally not wired to real images yet — `ProductCard`
  takes a `coverUrl` prop that Phase 2/5 will fill with a signed R2 URL. Until
  then cards show the seal placeholder.

## Not yet implemented (later phases)

Auth, cart, checkout, PayPal, R2 uploads/downloads, admin dashboard, email,
SEO metadata beyond the basics in `layout.tsx`. See the phase plan.

## Deploying

This repo is meant to be pushed to the `kaizen-site` Vercel project (team
`kaizen-site`) with the env vars from `.env.example` set in Vercel's dashboard
— never commit real values into `.env.local` or this repo.
