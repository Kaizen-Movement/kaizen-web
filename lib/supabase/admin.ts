import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// DANGER: this client bypasses Row Level Security entirely.
// Only import this file from server-only code that has already
// verified the caller is authorized (webhook signature, admin check, etc).
// Never import this into a Client Component or expose SUPABASE_SERVICE_ROLE_KEY
// to the browser.
//
// Same no-store fetch override as the RLS client (see server.ts) — this
// client is used for order fulfillment, download-token redemption, and
// webhook processing, none of which should ever see a stale cached result.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );
}
