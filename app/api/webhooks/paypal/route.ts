import { NextResponse } from "next/server";
import { verifyWebhookSignature, capturePayPalOrder } from "@/lib/paypal/client";
import { fulfillOrder } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    // Not configured yet — accept but no-op rather than error, so PayPal
    // doesn't retry-storm us while we're mid-setup.
    return NextResponse.json({ received: true, note: "webhook not configured" });
  }

  const rawBody = await request.text();
  const event = JSON.parse(rawBody);

  const isValid = await verifyWebhookSignature(
    {
      transmissionId: request.headers.get("paypal-transmission-id") ?? "",
      transmissionTime: request.headers.get("paypal-transmission-time") ?? "",
      certUrl: request.headers.get("paypal-cert-url") ?? "",
      authAlgo: request.headers.get("paypal-auth-algo") ?? "",
      transmissionSig: request.headers.get("paypal-transmission-sig") ?? "",
    },
    webhookId,
    event
  );

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Dedupe: the unique constraint on paypal_event_id makes this safe even
  // if PayPal retries delivery of the same event multiple times.
  const { error: insertError } = await admin
    .from("paypal_webhook_events")
    .insert({
      paypal_event_id: event.id,
      event_type: event.event_type,
      payload: event,
    });

  if (insertError) {
    // Unique violation means we've already processed this exact event.
    if (insertError.code === "23505") {
      return NextResponse.json({ received: true, note: "duplicate event" });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (
    event.event_type === "CHECKOUT.ORDER.APPROVED" ||
    event.event_type === "PAYMENT.CAPTURE.COMPLETED"
  ) {
    const paypalOrderId =
      event.resource?.id ??
      event.resource?.supplementary_data?.related_ids?.order_id;

    if (paypalOrderId) {
      const { data: order } = await admin
        .from("orders")
        .select("id, status")
        .eq("paypal_order_id", paypalOrderId)
        .maybeSingle();

      if (order && order.status !== "paid") {
        try {
          const capture = await capturePayPalOrder(paypalOrderId);
          if (capture.status === "COMPLETED") {
            await fulfillOrder(order.id, capture.captureId, capture.payerEmail);
          }
        } catch {
          // Already captured via the direct client-side flow, most likely —
          // fulfillOrder's idempotency means this is safe to swallow.
        }
      }
    }
  }

  await admin
    .from("paypal_webhook_events")
    .update({ processed: true })
    .eq("paypal_event_id", event.id);

  return NextResponse.json({ received: true });
}
