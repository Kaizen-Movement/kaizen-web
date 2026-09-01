import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MemberAccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/members/login");

  const supabase = createClient();

  const { data: profile } = await supabase
    .from("member_profiles")
    .select("*, membership_plans(name, interval, price_cents)")
    .eq("id", user.id)
    .maybeSingle();

  const { count: libraryCount } = await supabase
    .from("member_library")
    .select("*", { count: "exact", head: true })
    .eq("member_id", user.id);

  const plan = profile?.membership_plans as any;

  return (
    <div>
      <p className="eyebrow mb-2">Settings</p>
      <h1 className="font-display text-3xl text-bone">My Account</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {/* Profile card */}
        <div className="border border-white/10 bg-charcoal p-6">
          <h2 className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Profile</h2>
          <div className="mt-4 space-y-3">
            <div>
              <p className="font-mono text-[10px] uppercase text-bone/30">Email</p>
              <p className="mt-0.5 text-sm text-bone">{user.email}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-bone/30">Display Name</p>
              <p className="mt-0.5 text-sm text-bone">{profile?.display_name || "—"}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-bone/30">Member Since</p>
              <p className="mt-0.5 text-sm text-bone">
                {profile ? new Date(profile.created_at).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Membership card */}
        <div className="border border-white/10 bg-charcoal p-6">
          <h2 className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Membership</h2>
          <div className="mt-4 space-y-3">
            <div>
              <p className="font-mono text-[10px] uppercase text-bone/30">Status</p>
              <span className={`mt-1 inline-block rounded px-2 py-0.5 font-mono text-[10px] uppercase ${
                profile?.membership_status === "active"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/5 text-bone/40"
              }`}>
                {profile?.membership_status || "inactive"}
              </span>
            </div>
            {plan && (
              <div>
                <p className="font-mono text-[10px] uppercase text-bone/30">Plan</p>
                <p className="mt-0.5 text-sm text-bone">
                  {plan.name} — ${(plan.price_cents / 100).toFixed(2)}/{plan.interval}
                </p>
              </div>
            )}
            {profile?.membership_expires_at && (
              <div>
                <p className="font-mono text-[10px] uppercase text-bone/30">
                  {profile.membership_status === "active" ? "Renews" : "Expired"}
                </p>
                <p className="mt-0.5 text-sm text-bone">
                  {new Date(profile.membership_expires_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Library stats */}
        <div className="border border-white/10 bg-charcoal p-6 sm:col-span-2">
          <h2 className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Library</h2>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="font-display text-2xl text-gold">{libraryCount ?? 0}</p>
              <p className="mt-1 font-mono text-[10px] uppercase text-bone/30">Items in library</p>
            </div>
            <Link
              href="/members/library"
              className="border border-gold px-4 py-2 font-mono text-[11px] uppercase tracking-eyebrow text-gold transition-colors hover:bg-gold hover:text-void"
            >
              Go to Library
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
