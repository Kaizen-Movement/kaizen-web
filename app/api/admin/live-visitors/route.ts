import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/auth";

const ACTIVE_WINDOW_SECONDS = 90;

export async function GET() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const supabase = createClient();
  const cutoff = new Date(Date.now() - ACTIVE_WINDOW_SECONDS * 1000).toISOString();

  const { data: rows } = await supabase
    .from("visitor_heartbeats")
    .select("path")
    .gte("last_seen", cutoff);

  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    counts.set(row.path, (counts.get(row.path) ?? 0) + 1);
  }

  const topPaths = Array.from(counts.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({ count: rows?.length ?? 0, topPaths });
}
