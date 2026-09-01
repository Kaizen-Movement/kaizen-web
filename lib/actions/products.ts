"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/auth";
import { deleteFromR2 } from "@/lib/r2/storage";

export interface ProductFormState {
  error?: string;
}

function parseListField(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildProductPayload(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    kind: String(formData.get("kind") ?? "subliminal"),
    category_id: String(formData.get("category_id") ?? "") || null,
    short_description: String(formData.get("short_description") ?? "") || null,
    long_description: String(formData.get("long_description") ?? "") || null,
    benefits: parseListField(formData.get("benefits")),
    whats_included: parseListField(formData.get("whats_included")),
    how_it_works: String(formData.get("how_it_works") ?? "") || null,
    price_cents: Math.round(Number(formData.get("price") ?? 0) * 100),
    status: String(formData.get("status") ?? "draft"),
    is_featured: formData.get("is_featured") === "on",
    is_recommended: formData.get("is_recommended") === "on",
  };
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return { error: "Not authorized." };

  const supabase = createClient();
  const payload = buildProductPayload(formData);

  if (!payload.slug || !payload.title) {
    return { error: "Title and slug are required." };
  }

  const { error } = await supabase.from("products").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return { error: "Not authorized." };

  const supabase = createClient();
  const payload = buildProductPayload(formData);

  if (!payload.slug || !payload.title) {
    return { error: "Title and slug are required." };
  }

  const { error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath(`/products/${payload.slug}`);
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(productId: string) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) throw new Error("Not authorized.");

  const supabase = createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function toggleFeatured(productId: string, next: boolean) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) throw new Error("Not authorized.");

  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_featured: next })
    .eq("id", productId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function deleteProductFile(fileId: string) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) throw new Error("Not authorized.");

  const supabase = createClient();

  const { data: file, error: fetchError } = await supabase
    .from("product_files")
    .select("id, r2_key, product_id")
    .eq("id", fileId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!file) return;

  // Best-effort R2 cleanup — if this throws, we still remove the DB row
  // rather than leaving a dangling reference an admin can't get rid of.
  try {
    await deleteFromR2(file.r2_key);
  } catch {
    // orphaned object in R2 is a much smaller problem than a stuck UI
  }

  const { error: deleteError } = await supabase
    .from("product_files")
    .delete()
    .eq("id", fileId);
  if (deleteError) throw new Error(deleteError.message);

  if (file.product_id) {
    revalidatePath(`/admin/products/${file.product_id}/edit`);
  }
  revalidatePath("/admin/media");
}

/**
 * Attaches a previously-uploaded unassigned file (from the Media Library)
 * to a product — no re-upload needed, just a database link.
 */
export async function assignFileToProduct(fileId: string, productId: string) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) throw new Error("Not authorized.");

  const supabase = createClient();
  const { error } = await supabase
    .from("product_files")
    .update({ product_id: productId })
    .eq("id", fileId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/admin/media");
}
