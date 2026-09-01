"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/auth";

export interface HomepageFormState {
  error?: string;
  success?: boolean;
}

export async function updateHomepageContent(
  _prevState: HomepageFormState,
  formData: FormData
): Promise<HomepageFormState> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return { error: "Not authorized." };

  const supabase = createClient();

  const heroValue = {
    title: String(formData.get("hero_title") ?? "").trim(),
    subtitle: String(formData.get("hero_subtitle") ?? "").trim(),
    description: String(formData.get("hero_description") ?? "").trim(),
    primary_cta_label: String(formData.get("hero_primary_cta") ?? "").trim(),
    secondary_cta_label: String(formData.get("hero_secondary_cta") ?? "").trim(),
  };

  const featuredPanelValue = {
    title: String(formData.get("featured_title") ?? "").trim(),
    description: String(formData.get("featured_description") ?? "").trim(),
  };

  const { error } = await supabase.from("homepage_content").upsert([
    { key: "hero", value: heroValue, updated_at: new Date().toISOString() },
    {
      key: "featured_panel",
      value: featuredPanelValue,
      updated_at: new Date().toISOString(),
    },
  ]);

  if (error) return { error: error.message };

  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { success: true };
}
