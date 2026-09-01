import { NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal/client";
import { fulfillOrder } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { paypalOrderId } = await request.json();
    if (!paypalOrderId) {
      return NextResponse.json(
        { error: "paypalOrderId is required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: order, error: findError } = await admin
      .from("orders")
      .select("id, status")
      .eq("paypal_order_id", paypalOrderId)
      .maybeSingle();

    if (findError || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Idempotent: if a retry lands here after we already fulfilled it
    // (e.g. the client's fetch was interrupted after capture succeeded),
    // don't attempt to capture with PayPal again — fulfillOrder() itself
    // detects the already-paid state and just returns existing tokens.
    if (order.status === "paid") {
      const downloads = await fulfillOrder(order.id);
      return NextResponse.json({ success: true, downloads });
    }

    // The actual, authoritative payment verification — server calls PayPal
    // directly. We never trust a client-side "it worked" signal alone.
    let capture;
    try {
      capture = await capturePayPalOrder(paypalOrderId);
    } catch (captureErr) {
      // Possible race: the webhook already captured this order between our
      // status check above and this call. Re-check before treating it as
      // a real failure — if it's now paid, the payment genuinely succeeded.
      const { data: recheck } = await admin
        .from("orders")
        .select("id, status")
        .eq("id", order.id)
        .maybeSingle();

      if (recheck?.status === "paid") {
        const downloads = await fulfillOrder(order.id);
        return NextResponse.json({ success: true, downloads });
      }
      throw captureErr;
    }

    if (capture.status !== "COMPLETED") {
      return NextResponse.json(
        { error: `Payment not completed (status: ${capture.status}).` },
        { status: 402 }
      );
    }

    const downloads = await fulfillOrder(
      order.id,
      capture.captureId,
      capture.payerEmail
    );

    return NextResponse.json({ success: true, downloads });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Capture failed." },
      { status: 500 }
    );
  }
}
