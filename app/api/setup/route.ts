import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and an 8+ character password are required." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Bootstrap gate: this route only ever works while admin_users is empty.
  // Once the first admin exists, it permanently refuses — preventing anyone
  // from using this endpoint to mint themselves admin access later.
  const { count, error: countError } = await admin
    .from("admin_users")
    .select("*", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Setup already completed. This endpoint is now disabled." },
      { status: 403 }
    );
  }

  const { data: userData, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !userData?.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Failed to create user." },
      { status: 500 }
    );
  }

  const { error: adminInsertError } = await admin
    .from("admin_users")
    .insert({ id: userData.user.id, role: "owner" });

  if (adminInsertError) {
    return NextResponse.json(
      { error: adminInsertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
