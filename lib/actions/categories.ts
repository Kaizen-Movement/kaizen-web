"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/auth";

export async function createCategory(formData: FormData) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) throw new Error("Not authorized.");

  const supabase = createClient();
  const slug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "") || null;

  if (!slug || !name) throw new Error("Name and slug are required.");

  const { error } = await supabase
    .from("categories")
    .insert({ slug, name, description });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategory(categoryId: string) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) throw new Error("Not authorized.");

  const supabase = createClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/categories");
  revalidatePath("/");
}
