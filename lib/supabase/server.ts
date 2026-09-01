import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// RLS-respecting server client — use this everywhere EXCEPT the handful of
// server-only operations that must bypass RLS (see admin.ts).
//
// IMPORTANT: global.fetch below forces cache: 'no-store' on every request
// this client makes. Without it, Next.js's Data Cache can silently serve
// stale query results indefinitely on "dynamic" routes — a real bug found
// in production where edited/corrected product content kept showing old
// values to real visitors. For an ecommerce site (prices, stock, and in
// this case content-safety edits) that gap is not acceptable.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, cache: "no-store" }),
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore if middleware
            // is refreshing sessions.
          }
        },
      },
    }
  );
}
