import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { productId, fileId, position, duration, completed } = body;

  if (!productId || !fileId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createClient();

  // Upsert progress — the table has a unique constraint on (member_id, product_id, product_file_id)
  const { error } = await supabase
    .from("playback_progress")
    .upsert(
      {
        member_id: user.id,
        product_id: productId,
        product_file_id: fileId,
        position_seconds: position || 0,
        duration_seconds: duration || 0,
        completed: completed || false,
        last_played_at: new Date().toISOString(),
      },
      { onConflict: "member_id,product_id,product_file_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
