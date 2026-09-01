import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/sender";
import { renderCheckoutReminderEmail } from "@/lib/email/templates/checkout-reminder";

const MIN_AGE_MS = 30 * 60 * 1000; // don't remind anyone still mid-checkout
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // don't reach back further than a week

/**
 * Runs on Vercel's cron schedule (see vercel.json). Finds pending orders
 * old enough to count as abandoned, young enough to still be worth
 * emailing about, and not yet reminded — sends one reminder each, then
 * marks them so this never emails the same checkout twice.
 *
 * Protected by CRON_SECRET: Vercel automatically sends
 * `Authorization: Bearer ${CRON_SECRET}` on cron-triggered requests to
 * your own project once that env var is set — this just verifies it
 * matches, so the endpoint can't be triggered by anyone else hitting the
 * URL directly.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const now = Date.now();
  const oldestAllowed = new Date(now - MAX_AGE_MS).toISOString();
  const newestAllowed = new Date(now - MIN_AGE_MS).toISOString();

  const { data: orders, error: ordersError } = await admin
    .from("orders")
    .select("id, customer_email")
    .eq("status", "pending")
    .is("reminder_sent_at", null)
    .not("customer_email", "is", null)
    .gte("created_at", oldestAllowed)
    .lt("created_at", newestAllowed)
    .limit(200);

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }
  if (!orders || orders.length === 0) {
    return NextResponse.json({ sent: 0, message: "Nothing to remind." });
  }

  let sent = 0;
  let failed = 0;

  for (const order of orders) {
    try {
      const { data: items } = await admin
        .from("order_items")
        .select("product_title_snapshot, product_id")
        .eq("order_id", order.id);

      if (!items || items.length === 0) continue;

      const productIds = items.map((i) => i.product_id).filter(Boolean) as string[];
      const { data: products } = await admin
        .from("products")
        .select("id, slug")
        .in("id", productIds);

      const slugById = new Map((products ?? []).map((p) => [p.id, p.slug]));

      const { subject, html } = renderCheckoutReminderEmail({
        items: items.map((i) => ({
          productTitle: i.product_title_snapshot,
          slug: (i.product_id && slugById.get(i.product_id)) || "",
        })),
      });

      const result = await sendEmail({ to: order.customer_email!, subject, html });

      if (result.sent) {
        await admin
          .from("orders")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", order.id);
        sent += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({ sent, failed, checked: orders.length });
}
