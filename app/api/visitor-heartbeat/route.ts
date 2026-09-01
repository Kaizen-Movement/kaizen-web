import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { sessionId, path } = await request.json();

    if (typeof sessionId !== "string" || sessionId.length < 8 || sessionId.length > 100) {
      return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
    }
    if (typeof path !== "string" || path.length > 500) {
      return NextResponse.json({ error: "Invalid path." }, { status: 400 });
    }

    const admin = createAdminClient();
    const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;

    await admin.from("visitor_heartbeats").upsert(
      {
        session_id: sessionId,
        path,
        user_agent: userAgent,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "session_id" }
    );

    // Opportunistic cleanup — no cron needed for a table this low-stakes.
    // ~1 in 50 heartbeats trims anything untouched for a day, keeping the
    // table from growing unbounded without adding infra.
    if (Math.random() < 0.02) {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await admin.from("visitor_heartbeats").delete().lt("last_seen", cutoff);
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Never let a heartbeat failure surface to the visitor.
    return NextResponse.json({ ok: false });
  }
}
