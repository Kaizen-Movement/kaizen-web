import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/sender";
import { renderOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";

function toAbsoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kaizensubliminals.store";
  return `${base.replace(/\/$/, "")}${path}`;
}

export interface CartLineInput {
  productId: string;
  quantity: number;
}

export interface PendingOrderResult {
  orderId: string;
  totalCents: number;
  currency: string;
  lineCount: number;
}

/**
 * Creates a pending order from product IDs + quantities only — prices are
 * always re-fetched from the products table here, never taken from the
 * client. A tampered client claiming a lower price cannot affect the
 * amount actually charged.
 */
export async function createPendingOrder(
  items: CartLineInput[],
  email: string
): Promise<PendingOrderResult> {
  if (!items.length) throw new Error("Cart is empty.");
  if (!email || !email.includes("@")) throw new Error("Valid email required.");

  const admin = createAdminClient();

  const productIds = items.map((i) => i.productId);
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, title, price_cents")
    .in("id", productIds)
    .eq("status", "published");

  if (productsError) throw new Error(productsError.message);
  if (!products || products.length === 0) {
    throw new Error("None of the requested products are available.");
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  const lineItems = items
    .filter((i) => productMap.has(i.productId))
    .map((i) => {
      const product = productMap.get(i.productId)!;
      return {
        product_id: product.id,
        product_title_snapshot: product.title,
        price_cents: product.price_cents,
        quantity: Math.max(1, i.quantity),
      };
    });

  const totalCents = lineItems.reduce(
    (sum, l) => sum + l.price_cents * l.quantity,
    0
  );

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      customer_email: email,
      status: "pending",
      subtotal_cents: totalCents,
      total_cents: totalCents,
      currency: "USD",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Failed to create order.");
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    lineItems.map((l) => ({ ...l, order_id: order.id }))
  );

  if (itemsError) throw new Error(itemsError.message);

  return {
    orderId: order.id,
    totalCents,
    currency: "USD",
    lineCount: lineItems.length,
  };
}

export interface DownloadLinkResult {
  productTitle: string;
  downloadPath: string | null;
  note?: string;
}

/**
 * Marks an order paid and generates download tokens for every deliverable
 * file on every purchased product. Idempotent — safe to call from both the
 * synchronous capture route AND the webhook handler without double-issuing
 * tokens, since it checks current order status first.
 */
export async function fulfillOrder(
  orderId: string,
  captureId?: string | null,
  payerEmail?: string | null
): Promise<DownloadLinkResult[]> {
  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, status, customer_email, total_cents, currency")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) throw new Error("Order not found.");

  // Already fulfilled — return existing tokens instead of minting new ones.
  // Note this also means we don't re-send the confirmation email here: the
  // email only fires once, below, on the actual pending -> paid transition.
  if (order.status === "paid") {
    return getExistingDownloadLinks(orderId);
  }

  await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paypal_capture_id: captureId ?? null,
      paypal_payer_email: payerEmail ?? null,
    })
    .eq("id", orderId);

  const { data: orderItems } = await admin
    .from("order_items")
    .select("id, product_id, product_title_snapshot")
    .eq("order_id", orderId);

  const results: DownloadLinkResult[] = [];

  for (const item of orderItems ?? []) {
    const { data: files } = await admin
      .from("product_files")
      .select("id")
      .eq("product_id", item.product_id);

    if (!files || files.length === 0) {
      results.push({
        productTitle: item.product_title_snapshot,
        downloadPath: null,
        note: "File not yet available — we'll email you as soon as it's ready.",
      });
      continue;
    }

    for (const file of files) {
      const { data: tokenRow } = await admin
        .from("download_tokens")
        .insert({ order_item_id: item.id, product_file_id: file.id })
        .select("token")
        .single();

      if (tokenRow) {
        results.push({
          productTitle: item.product_title_snapshot,
          downloadPath: `/download/${tokenRow.token}`,
        });
      }
    }
  }

  // Best-effort — a failed email must never undo a successful payment or
  // block the customer from seeing their download links in the browser
  // (the checkout UI shows them directly regardless of email delivery).
  if (order.customer_email) {
    const { subject, html } = renderOrderConfirmationEmail({
      orderId,
      totalCents: order.total_cents,
      currency: order.currency,
      items: results.map((r) => ({
        productTitle: r.productTitle,
        downloadUrl: r.downloadPath ? toAbsoluteUrl(r.downloadPath) : null,
        note: r.note,
      })),
    });

    const emailResult = await sendEmail({
      to: order.customer_email,
      subject,
      html,
    });

    if (!emailResult.sent) {
      // Swallowed deliberately — logged for visibility (shows up in Vercel
      // runtime logs) but never thrown, since fulfillment already succeeded.
      console.error(
        `Order confirmation email failed for order ${orderId}: ${emailResult.error}`
      );
    }
  }

  return results;
}

export async function getExistingDownloadLinks(
  orderId: string
): Promise<DownloadLinkResult[]> {
  const admin = createAdminClient();

  const { data: orderItems } = await admin
    .from("order_items")
    .select("id, product_title_snapshot")
    .eq("order_id", orderId);

  const results: DownloadLinkResult[] = [];

  for (const item of orderItems ?? []) {
    const { data: tokens } = await admin
      .from("download_tokens")
      .select("token")
      .eq("order_item_id", item.id);

    if (!tokens || tokens.length === 0) {
      results.push({
        productTitle: item.product_title_snapshot,
        downloadPath: null,
        note: "File not yet available — we'll email you as soon as it's ready.",
      });
      continue;
    }

    for (const t of tokens) {
      results.push({
        productTitle: item.product_title_snapshot,
        downloadPath: `/download/${t.token}`,
      });
    }
  }

  return results;
}
