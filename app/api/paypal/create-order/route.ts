import { NextResponse } from "next/server";
import { createPendingOrder } from "@/lib/orders";
import { createPayPalOrder } from "@/lib/paypal/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { items, email } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const pendingOrder = await createPendingOrder(
      items.map((i: { productId: string; quantity?: number }) => ({
        productId: i.productId,
        quantity: i.quantity ?? 1,
      })),
      email
    );

    const { paypalOrderId } = await createPayPalOrder(
      pendingOrder.totalCents,
      pendingOrder.currency,
      pendingOrder.orderId
    );

    const admin = createAdminClient();
    await admin
      .from("orders")
      .update({ paypal_order_id: paypalOrderId })
      .eq("id", pendingOrder.orderId);

    return NextResponse.json({ paypalOrderId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed." },
      { status: 500 }
    );
  }
}
