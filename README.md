# Kaizen Premium Store v2

Mobile-first static Kaizen storefront for Vercel.

## Files
- `index.html` — customer storefront
- `app.css` — premium platinum visual system
- `app.js` — routing, remote catalog, cart and PayPal checkout
- `catalog.js` — built-in fallback catalog
- `config.js` — public client configuration only
- `assets/hero-kaizen.png` — home hero visual
- `admin.html`, `admin.css`, `admin.js` — private product/image dashboard
- `supabase-setup.sql` — Supabase tables, RLS and Storage policies
- `vercel.json` — Vercel settings/security headers

## Customer-facing cleanup
Internal implementation wording such as "mobile-first", Supabase/Cloudflare setup notes and temporary development copy are not shown on the public storefront.

## Private admin
The dashboard is available at `/admin` and is deliberately not linked from the public site. The URL itself is **not** the security mechanism. Supabase Auth + RLS protect write access.

1. Run `supabase-setup.sql` in Supabase SQL Editor.
2. Create your admin user in Supabase Authentication.
3. Run the final commented SQL statement in `supabase-setup.sql` with your admin email.
4. Put your Supabase project URL in `config.js`.
5. Keep the anon key in `config.js`; never put the service-role key here.
6. Visit `/admin`, sign in, and choose **Import base catalog** once.
7. You can then upload product pictures, edit name/price/category/description and hide/show products without redeploying.

## Cart / PayPal
The cart is functional in the browser and persists with `localStorage`. PayPal checkout uses the configured public PayPal Client ID.

For a temporary storefront this works, but the final production checkout should create/capture PayPal orders in a Vercel server function so product prices cannot be altered in the browser.

## Deploy
Upload/push this entire folder to the Vercel project connected to `kaizensubliminals.store`.
