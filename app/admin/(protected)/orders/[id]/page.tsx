import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResendEmailButton, RegenerateTokenButton } from "@/components/admin/OrderActions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_title_snapshot, price_cents, quantity")
    .eq("order_id", order.id);

  const itemIds = (items ?? []).map((i) => i.id);
  const { data: tokens } = itemIds.length
    ? await supabase
        .from("download_tokens")
        .select(
          "id, order_item_id, token, download_count, max_downloads, expires_at, created_at"
        )
        .in("order_item_id", itemIds)
    : { data: [] };

  const tokensByItem = new Map<string, typeof tokens>();
  for (const t of tokens ?? []) {
    const list = tokensByItem.get(t.order_item_id) ?? [];
    list.push(t);
    tokensByItem.set(t.order_item_id, list);
  }

  return (
    <div>
      <Link
        href="/admin/orders"
        className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/40 hover:text-gold"
      >
        ← All Orders
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <p className="eyebrow mb-2">Order</p>
          <h1 className="font-display text-3xl text-bone">
            {order.customer_email}
          </h1>
          <p className="mt-2 font-mono text-xs text-bone/40">
            {order.id} · placed {formatDate(order.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`font-mono text-[11px] uppercase tracking-eyebrow ${
              order.status === "paid" ? "text-green-400" : "text-bone/50"
            }`}
          >
            {order.status}
          </p>
          <p className="mt-2 font-display text-2xl text-gold">
            ${(order.total_cents / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {order.status === "paid" && (
        <div className="mt-6">
          <ResendEmailButton orderId={order.id} />
        </div>
      )}

      <div className="mt-10 border border-white/10">
        {(items ?? []).map((item) => (
          <div key={item.id} className="border-b border-white/10 p-5 last:border-b-0">
            <div className="flex items-center justify-between">
              <p className="text-bone">{item.product_title_snapshot}</p>
              <p className="font-mono text-sm text-bone/60">
                ${(item.price_cents / 100).toFixed(2)} × {item.quantity}
              </p>
            </div>

            <div className="mt-3 space-y-2">
              {(tokensByItem.get(item.id) ?? []).length === 0 ? (
                <p className="text-xs text-bone/30">
                  No download token yet — file may not have been attached to this product at time of purchase.
                </p>
              ) : (
                (tokensByItem.get(item.id) ?? []).map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between border border-white/5 bg-panel/40 px-3 py-2"
                  >
                    <p className="font-mono text-[11px] text-bone/50">
                      {token.download_count}/{token.max_downloads} downloads ·
                      expires {formatDate(token.expires_at)}
                    </p>
                    <RegenerateTokenButton tokenId={token.id} orderId={order.id} />
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
