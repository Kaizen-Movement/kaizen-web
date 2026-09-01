import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LiveVisitorsCard } from "@/components/admin/LiveVisitorsCard";

export default async function AdminDashboard() {
  const supabase = createClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const abandonedCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const [
    { count: productCount },
    { count: orderCount },
    { data: paidOrders },
    { data: weekOrders },
    { data: monthOrders },
    { count: pendingCount },
    { count: customerCount },
    { count: abandonedCount },
    { count: todayViews },
    { count: weekViews },
    { count: monthViews },
    { count: memberCount },
    { count: activeMemberCount },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total_cents").eq("status", "paid"),
    supabase.from("orders").select("total_cents").eq("status", "paid").gte("created_at", weekAgo),
    supabase.from("orders").select("total_cents").eq("status", "paid").gte("created_at", monthAgo),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("legacy_customers").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending").lt("created_at", abandonedCutoff),
    supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", monthAgo),
    supabase.from("member_profiles").select("*", { count: "exact", head: true }),
    supabase.from("member_profiles").select("*", { count: "exact", head: true }).eq("membership_status", "active"),
  ]);

  const totalRevenueCents = (paidOrders ?? []).reduce((sum, o) => sum + (o.total_cents ?? 0), 0);
  const weekRevenueCents = (weekOrders ?? []).reduce((sum, o) => sum + (o.total_cents ?? 0), 0);
  const monthRevenueCents = (monthOrders ?? []).reduce((sum, o) => sum + (o.total_cents ?? 0), 0);

  return (
    <div>
      <p className="eyebrow mb-2">Overview</p>
      <h1 className="font-display text-3xl text-bone">Dashboard</h1>

      {/* Revenue + Traffic Row */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Revenue (All Time)</p>
          <p className="mt-2 font-display text-3xl text-gold">${(totalRevenueCents / 100).toFixed(2)}</p>
        </div>
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Revenue (30d)</p>
          <p className="mt-2 font-display text-3xl text-gold">${(monthRevenueCents / 100).toFixed(2)}</p>
          <p className="mt-1 font-mono text-[10px] text-bone/30">7d: ${(weekRevenueCents / 100).toFixed(2)}</p>
        </div>
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Orders</p>
          <p className="mt-2 font-display text-3xl text-gold">{orderCount ?? 0}</p>
          <p className="mt-1 font-mono text-[10px] text-bone/30">{pendingCount ?? 0} pending</p>
        </div>
        <LiveVisitorsCard />
      </div>

      {/* Traffic + Members Row */}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Views Today</p>
          <p className="mt-2 font-display text-3xl text-gold">{(todayViews ?? 0).toLocaleString()}</p>
        </div>
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Views (7d)</p>
          <p className="mt-2 font-display text-3xl text-gold">{(weekViews ?? 0).toLocaleString()}</p>
        </div>
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Views (30d)</p>
          <p className="mt-2 font-display text-3xl text-gold">{(monthViews ?? 0).toLocaleString()}</p>
        </div>
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Members</p>
          <p className="mt-2 font-display text-3xl text-gold">{activeMemberCount ?? 0}</p>
          <p className="mt-1 font-mono text-[10px] text-bone/30">{memberCount ?? 0} total profiles</p>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Products</p>
          <p className="mt-2 font-display text-3xl text-gold">{productCount ?? 0}</p>
        </div>
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Customers</p>
          <p className="mt-2 font-display text-3xl text-gold">{customerCount ?? 0}</p>
        </div>
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Abandoned Checkouts</p>
          <p className="mt-2 font-display text-3xl text-gold">{abandonedCount ?? 0}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "View Analytics", href: "/admin/analytics" },
          { label: "Manage Products", href: "/admin/products" },
          { label: "View Orders", href: "/admin/orders" },
          { label: "Manage Members", href: "/admin/memberships" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border border-white/10 bg-charcoal p-4 text-center font-mono text-[11px] uppercase tracking-eyebrow text-bone/60 transition-colors hover:border-gold/40 hover:text-gold"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
