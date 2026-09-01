# Kaizen Premium Store — Secure Checkout Edition

Static mobile-first Kaizen storefront for Vercel with:

- premium platinum storefront
- category glow system
- product images managed through the private Supabase admin dashboard
- persistent browser cart
- PayPal UI in the browser
- PayPal order creation/capture on Vercel server functions
- trusted product prices read from Supabase server-side
- server-written completed orders and purchase entitlements

## Project

```text
index.html
app.css
app.js
config.js
catalog.js
admin.html
admin.css
admin.js
assets/
api/
  paypal/
    _lib.js
    create-order.js
    capture-order.js
supabase-setup.sql
production-checkout.sql
vercel.json
.env.example
```

## Existing Supabase project

If you already ran the earlier Kaizen SQL setup, run:

`production-checkout.sql`

Do not rerun the old temporary SQL file from a previous package because it allowed anonymous order inserts.

## Fresh Supabase project

Run:

`supabase-setup.sql`

Then create your private admin Auth user and run the admin-role statement shown at the bottom of that SQL file.

## Browser config

Edit `config.js` with PUBLIC values only:

```text
PAYPAL_CLIENT_ID
SUPABASE_URL
SUPABASE_ANON_KEY
```

Keep `CURRENCY` equal to the Vercel `PAYPAL_CURRENCY` value.

Never place `PAYPAL_CLIENT_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` in a browser file.

## Vercel environment variables

Add these under Vercel -> Project -> Settings -> Environment Variables:

```text
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_ENV=sandbox
PAYPAL_CURRENCY=USD
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Test with sandbox first. When ready for real sales, replace both PayPal credentials with LIVE credentials and change `PAYPAL_ENV` to `live`.

## Products must exist in Supabase

The secure server functions use `public.products` as the trusted price catalog. Use `/admin` to import/manage the product list before live checkout.

The browser never sends a trusted price. It sends product slugs only.

## Secure checkout flow

```text
Customer cart
 -> POST /api/paypal/create-order with product slugs
 -> Vercel reads active product prices from Supabase
 -> Vercel calculates total
 -> Vercel creates PayPal order
 -> buyer approves
 -> POST /api/paypal/capture-order with PayPal order ID
 -> Vercel captures and verifies amount/currency
 -> Vercel writes completed order
 -> Vercel grants purchase entitlements
```

## Private admin

The storefront does not link to the admin route.

```text
https://kaizensubliminals.store/admin
```

Actual access is protected by Supabase Auth + the `profiles.role = 'admin'` check, not by the hidden URL alone.
