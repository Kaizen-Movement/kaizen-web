import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOrdersPage() {
  const supabase = createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <p className="eyebrow mb-2">Sales</p>
      <h1 className="mb-8 font-display text-3xl text-bone">Orders</h1>

      {orders && orders.length > 0 ? (
        <div className="border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">
                <th className="p-4">Email</th>
                <th className="p-4">Status</th>
                <th className="p-4">Total</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-0">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex w-full items-center p-4 text-bone"
                    >
                      {order.customer_email}
                    </Link>
                  </td>
                  <td className="p-4 font-mono text-bone/60">{order.status}</td>
                  <td className="p-4 font-mono text-gold">
                    ${(order.total_cents / 100).toFixed(2)}
                  </td>
                  <td className="p-4 text-bone/40">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-bone/40">
          No orders yet — this fills in once checkout (Phase 4) is live.
        </p>
      )}
    </div>
  );
}
