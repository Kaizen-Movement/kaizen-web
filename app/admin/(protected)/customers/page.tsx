import { createClient } from "@/lib/supabase/server";

export default async function AdminCustomersPage() {
  const supabase = createClient();

  const [{ data: legacy }, { data: liveOrders }] = await Promise.all([
    supabase
      .from("legacy_customers")
      .select(
        "id, first_name, last_name, email, total_spent_cents, total_orders, accepts_email_marketing, claimed_by"
      )
      .order("total_spent_cents", { ascending: false })
      .limit(200),
    supabase
      .from("orders")
      .select("customer_email, total_cents")
      .eq("status", "paid"),
  ]);

  // Merge in orders placed through the live site (post-launch) so returning
  // customers show up-to-date totals, not just their frozen Shopify import.
  const liveByEmail = new Map<string, { count: number; cents: number }>();
  for (const o of liveOrders ?? []) {
    const key = o.customer_email.toLowerCase();
    const existing = liveByEmail.get(key) ?? { count: 0, cents: 0 };
    existing.count += 1;
    existing.cents += o.total_cents ?? 0;
    liveByEmail.set(key, existing);
  }

  return (
    <div>
      <p className="eyebrow mb-2">People</p>
      <h1 className="mb-2 font-display text-3xl text-bone">Customers</h1>
      <p className="mb-8 text-sm text-bone/50">
        Imported from Shopify ({(legacy ?? []).length} shown, ranked by
        historical spend). "Live orders" reflects purchases made through this
        site since launch, separate from the Shopify import total.
      </p>

      <div className="border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Shopify Spend</th>
              <th className="p-4">Live Orders</th>
              <th className="p-4">Marketing</th>
              <th className="p-4">Account</th>
            </tr>
          </thead>
          <tbody>
            {(legacy ?? []).map((c) => {
              const live = liveByEmail.get(c.email.toLowerCase());
              return (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="p-4 text-bone">
                    {[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="p-4 text-bone/70">{c.email}</td>
                  <td className="p-4 font-mono text-gold">
                    ${((c.total_spent_cents ?? 0) / 100).toFixed(2)}
                    <span className="ml-1 text-bone/30">
                      ({c.total_orders ?? 0})
                    </span>
                  </td>
                  <td className="p-4 font-mono text-bone/60">
                    {live ? `$${(live.cents / 100).toFixed(2)} (${live.count})` : "—"}
                  </td>
                  <td className="p-4 font-mono text-[11px] text-bone/40">
                    {c.accepts_email_marketing ? "Opted in" : "—"}
                  </td>
                  <td className="p-4 font-mono text-[11px] text-bone/40">
                    {c.claimed_by ? "Claimed" : "Unclaimed"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
