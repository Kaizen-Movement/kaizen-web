import { createClient } from "@/lib/supabase/server";
import { ReminderButton } from "@/components/admin/ReminderButton";

const STALE_AFTER_MINUTES = 30;

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function AbandonedCheckoutsPage() {
  const supabase = createClient();

  const cutoff = new Date(Date.now() - STALE_AFTER_MINUTES * 60 * 1000).toISOString();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, customer_email, total_cents, currency, created_at, reminder_sent_at")
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(100);

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: items } = orderIds.length
    ? await supabase
        .from("order_items")
        .select("order_id, product_title_snapshot")
        .in("order_id", orderIds)
    : { data: [] };

  const itemsByOrder = new Map<string, string[]>();
  for (const item of items ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item.product_title_snapshot);
    itemsByOrder.set(item.order_id, list);
  }

  return (
    <div>
      <p className="eyebrow mb-2">Sales</p>
      <h1 className="mb-2 font-display text-3xl text-bone">Abandoned Checkouts</h1>
      <p className="mb-8 max-w-2xl text-sm text-bone/50">
        Checkouts where a customer entered their email and started paying
        (via PayPal) but never completed the purchase, at least{" "}
        {STALE_AFTER_MINUTES} minutes ago. A reminder email now sends
        automatically once a day for anything not yet reminded — the button
        below is for sending one immediately instead of waiting, or sending
        a second nudge.
      </p>

      {orders && orders.length > 0 ? (
        <div className="border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">
                <th className="p-4">Email</th>
                <th className="p-4">Items</th>
                <th className="p-4">Value</th>
                <th className="p-4">Abandoned</th>
                <th className="p-4">Reminder</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-white/5">
                  <td className="p-4 text-bone">{order.customer_email}</td>
                  <td className="p-4 text-bone/60">
                    {(itemsByOrder.get(order.id) ?? []).join(", ")}
                  </td>
                  <td className="p-4 font-mono text-gold">
                    ${(order.total_cents / 100).toFixed(2)}
                  </td>
                  <td className="p-4 text-bone/40">{timeAgo(order.created_at)}</td>
                  <td className="p-4 font-mono text-[10px] uppercase tracking-eyebrow">
                    {order.reminder_sent_at ? (
                      <span className="text-green-400">
                        Sent {timeAgo(order.reminder_sent_at)}
                      </span>
                    ) : (
                      <span className="text-bone/30">Not yet</span>
                    )}
                  </td>
                  <td className="p-4">
                    <ReminderButton orderId={order.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-bone/40">No abandoned checkouts right now.</p>
      )}
    </div>
  );
}
