"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MembershipPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  interval: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface MemberRow {
  id: string;
  email: string;
  display_name: string | null;
  membership_status: string;
  plan_name: string | null;
  plan_interval: string | null;
  membership_started_at: string | null;
  membership_expires_at: string | null;
  total_spent_cents: number;
  library_count: number;
  created_at: string;
}

interface MembershipsData {
  plans: MembershipPlan[];
  members: MemberRow[];
  stats: {
    totalMembers: number;
    activeMembers: number;
    monthlyRevenue: number;
    lifetimeMembers: number;
  };
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    inactive: "bg-white/5 text-bone/40",
    cancelled: "bg-amber-500/20 text-amber-400",
    past_due: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 font-mono text-[10px] uppercase ${colors[status] || colors.inactive}`}>
      {status}
    </span>
  );
}

export default function MembershipsPage() {
  const [data, setData] = useState<MembershipsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"members" | "plans">("members");

  useEffect(() => {
    fetch("/api/admin/memberships")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="mt-12 text-center text-bone/30">Loading...</div>;
  if (!data) return <div className="mt-12 text-center text-bone/30">Failed to load</div>;

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow mb-2">Members</p>
          <h1 className="font-display text-3xl text-bone">Memberships</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Total Members</p>
          <p className="mt-2 font-display text-3xl text-gold">{data.stats.totalMembers}</p>
        </div>
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Active</p>
          <p className="mt-2 font-display text-3xl text-gold">{data.stats.activeMembers}</p>
        </div>
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Est. Monthly Rev</p>
          <p className="mt-2 font-display text-3xl text-gold">${(data.stats.monthlyRevenue / 100).toFixed(2)}</p>
        </div>
        <div className="border border-white/10 bg-charcoal p-6">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Lifetime Members</p>
          <p className="mt-2 font-display text-3xl text-gold">{data.stats.lifetimeMembers}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-white/10">
        {(["members", "plans"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 font-mono text-[11px] uppercase tracking-eyebrow transition-colors ${
              tab === t ? "border-b-2 border-gold text-gold" : "text-bone/40 hover:text-bone/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <div className="mt-6">
          {data.members.length === 0 ? (
            <p className="py-12 text-center text-bone/30">No members yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-3 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">Member</th>
                    <th className="pb-3 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">Status</th>
                    <th className="pb-3 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">Plan</th>
                    <th className="pb-3 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">Library</th>
                    <th className="pb-3 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">Spent</th>
                    <th className="pb-3 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.members.map((m) => (
                    <tr key={m.id} className="border-b border-white/5 transition-colors hover:bg-charcoal/50">
                      <td className="py-3">
                        <p className="text-sm text-bone">{m.display_name || "—"}</p>
                        <p className="font-mono text-[10px] text-bone/40">{m.email}</p>
                      </td>
                      <td className="py-3"><StatusBadge status={m.membership_status} /></td>
                      <td className="py-3 font-mono text-[11px] text-bone/60">
                        {m.plan_name ? `${m.plan_name} (${m.plan_interval})` : "—"}
                      </td>
                      <td className="py-3 font-mono text-[11px] text-gold">{m.library_count} items</td>
                      <td className="py-3 font-mono text-[11px] text-bone/60">
                        ${(m.total_spent_cents / 100).toFixed(2)}
                      </td>
                      <td className="py-3 font-mono text-[10px] text-bone/40">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "plans" && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.plans.map((plan) => (
            <div key={plan.id} className={`border bg-charcoal p-6 ${plan.is_active ? "border-gold/30" : "border-white/10 opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg text-bone">{plan.name}</h3>
                  <p className="mt-1 font-mono text-[10px] uppercase text-bone/40">{plan.interval}</p>
                </div>
                <p className="font-display text-2xl text-gold">${(plan.price_cents / 100).toFixed(2)}</p>
              </div>
              {plan.description && (
                <p className="mt-3 text-sm text-bone/50">{plan.description}</p>
              )}
              {Array.isArray(plan.features) && plan.features.length > 0 && (
                <ul className="mt-4 space-y-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-bone/60">
                      <span className="mt-0.5 text-gold">✓</span> {f}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className={`font-mono text-[10px] uppercase ${plan.is_active ? "text-emerald-400" : "text-bone/30"}`}>
                  {plan.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
