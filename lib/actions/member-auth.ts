"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface MemberAuthState {
  error?: string;
  success?: string;
}

export async function memberLoginAction(
  _prevState: MemberAuthState,
  formData: FormData
): Promise<MemberAuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  redirect("/members/library");
}

export async function memberSignupAction(
  _prevState: MemberAuthState,
  formData: FormData
): Promise<MemberAuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "");

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) return { error: error.message };

  // Create member profile
  if (data.user) {
    const admin = createAdminClient();
    await admin.from("member_profiles").upsert({
      id: data.user.id,
      display_name: displayName || null,
      membership_status: "inactive",
    });
  }

  redirect("/members/library");
}

export async function memberLogoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/members/login");
}
