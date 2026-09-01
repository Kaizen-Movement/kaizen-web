import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth";

export async function GET() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch plans
  const { data: plans } = await admin
    .from("membership_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  // Fetch all member profiles with their auth email and library count
  const { data: profiles } = await admin
    .from("member_profiles")
    .select("*, membership_plans(name, interval)")
    .order("created_at", { ascending: false });

  // Get auth users to map emails
  const memberIds = (profiles || []).map((p) => p.id);
  let emailMap: Record<string, string> = {};
  if (memberIds.length > 0) {
    // Fetch users in batches from auth
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of users) {
      emailMap[u.id] = u.email || "";
    }
  }

  // Get library counts per member
  const { data: libraryCounts } = await admin
    .from("member_library")
    .select("member_id");

  const libraryCountMap: Record<string, number> = {};
  for (const row of libraryCounts || []) {
    libraryCountMap[row.member_id] = (libraryCountMap[row.member_id] || 0) + 1;
  }

  const members = (profiles || []).map((p) => ({
    id: p.id,
    email: emailMap[p.id] || "unknown",
    display_name: p.display_name,
    membership_status: p.membership_status || "inactive",
    plan_name: (p.membership_plans as any)?.name || null,
    plan_interval: (p.membership_plans as any)?.interval || null,
    membership_started_at: p.membership_started_at,
    membership_expires_at: p.membership_expires_at,
    total_spent_cents: p.total_spent_cents || 0,
    library_count: libraryCountMap[p.id] || 0,
    created_at: p.created_at,
  }));

  // Calculate stats
  const activeMembers = members.filter((m) => m.membership_status === "active");
  const activePlans = plans || [];

  // Estimate monthly revenue from active members
  let monthlyRevenue = 0;
  for (const m of activeMembers) {
    const plan = activePlans.find((p) => p.name === m.plan_name);
    if (plan) {
      if (plan.interval === "monthly") monthlyRevenue += plan.price_cents;
      else if (plan.interval === "yearly") monthlyRevenue += Math.round(plan.price_cents / 12);
      // lifetime is one-time, not recurring
    }
  }

  const lifetimeMembers = activeMembers.filter((m) => m.plan_interval === "lifetime").length;

  return NextResponse.json({
    plans: plans || [],
    members,
    stats: {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      monthlyRevenue,
      lifetimeMembers,
    },
  });
}
