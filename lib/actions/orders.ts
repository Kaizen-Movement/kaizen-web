"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/auth";
import { getExistingDownloadLinks } from "@/lib/orders";
import { sendEmail } from "@/lib/email/sender";
import { renderOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { renderCheckoutReminderEmail } from "@/lib/email/templates/checkout-reminder";

function toAbsoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kaizensubliminals.store";
  return `${base.replace(/\/$/, "")}${path}`;
}

export interface ActionResult {
  success?: boolean;
  error?: string;
}

/**
 * Re-sends the order confirmation email using whatever download tokens
 * currently exist for the order — does NOT mint new tokens. Use
 * regenerateDownloadToken first if a link needs to actually change
 * (e.g. it was compromised or the customer says it's expired).
 */
export async function resendOrderEmail(orderId: string): Promise<ActionResult> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return { error: "Not authorized." };

  const supabase = createClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, customer_email, total_cents, currency")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) return { error: "Order not found." };
  if (order.status !== "paid") {
    return { error: "Only paid orders have a confirmation email to resend." };
  }
  if (!order.customer_email) return { error: "Order has no customer email on file." };

  const links = await getExistingDownloadLinks(orderId);

  const { subject, html } = renderOrderConfirmationEmail({
    orderId,
    totalCents: order.total_cents,
    currency: order.currency,
    items: links.map((l) => ({
      productTitle: l.productTitle,
      downloadUrl: l.downloadPath ? toAbsoluteUrl(l.downloadPath) : null,
      note: l.note,
    })),
  });

  const result = await sendEmail({ to: order.customer_email, subject, html });
  if (!result.sent) return { error: result.error ?? "Email failed to send." };

  return { success: true };
}

/**
 * Invalidates one download token and mints a fresh one in its place
 * (same order_item + product_file, new random token, reset expiry and
 * download count). The old token stops working immediately since it's
 * deleted, not just superseded — important if the reason for
 * regenerating is a leaked/compromised link. Does not send an email by
 * itself; call resendOrderEmail after if the customer needs the new
 * link delivered.
 */
export async function regenerateDownloadToken(
  tokenId: string,
  orderId: string
): Promise<ActionResult> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return { error: "Not authorized." };

  const supabase = createClient();

  const { data: oldToken, error: fetchError } = await supabase
    .from("download_tokens")
    .select("id, order_item_id, product_file_id")
    .eq("id", tokenId)
    .maybeSingle();

  if (fetchError || !oldToken) return { error: "Download token not found." };

  const { error: insertError } = await supabase.from("download_tokens").insert({
    order_item_id: oldToken.order_item_id,
    product_file_id: oldToken.product_file_id,
  });
  if (insertError) return { error: insertError.message };

  const { error: deleteError } = await supabase
    .from("download_tokens")
    .delete()
    .eq("id", oldToken.id);
  if (deleteError) return { error: deleteError.message };

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

/**
 * Sends a "you left something in your cart" reminder for a still-pending
 * order (i.e. an abandoned checkout — email + items were captured but
 * payment was never completed). Does not touch order status; the order
 * stays pending until the customer actually pays or it's cleaned up
 * separately.
 */
export async function resendCheckoutReminder(orderId: string): Promise<ActionResult> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return { error: "Not authorized." };

  const supabase = createClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, customer_email")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) return { error: "Order not found." };
  if (order.status !== "pending") {
    return { error: "This order is no longer pending — nothing to remind about." };
  }
  if (!order.customer_email) return { error: "No email on file for this checkout." };

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_title_snapshot, product_id")
    .eq("order_id", orderId);

  if (itemsError || !items || items.length === 0) {
    return { error: "No items found on this order." };
  }

  const productIds = items.map((i) => i.product_id).filter(Boolean) as string[];
  const { data: products } = await supabase
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

  const result = await sendEmail({ to: order.customer_email, subject, html });
  if (!result.sent) return { error: result.error ?? "Email failed to send." };

  await supabase
    .from("orders")
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq("id", orderId);

  revalidatePath("/admin/abandoned-checkouts");
  return { success: true };
}
