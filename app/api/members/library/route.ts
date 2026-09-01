import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignedCoverUrl } from "@/lib/r2/storage";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();

  // Get member's library items with product details
  const { data: libraryItems } = await supabase
    .from("member_library")
    .select(`
      id,
      product_id,
      access_type,
      products (
        id,
        title,
        cover_image_key
      )
    `)
    .eq("member_id", user.id)
    .order("granted_at", { ascending: false });

  if (!libraryItems || libraryItems.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Get product files for each product
  const productIds = [...new Set(libraryItems.map((li) => li.product_id))];
  const { data: productFiles } = await supabase
    .from("product_files")
    .select("id, product_id, file_name, r2_key, file_type")
    .in("product_id", productIds)
    .order("created_at", { ascending: true });

  // Get playback progress for this member
  const { data: progressRows } = await supabase
    .from("playback_progress")
    .select("product_id, product_file_id, position_seconds, duration_seconds, completed")
    .eq("member_id", user.id);

  // Build response with signed cover URLs
  const items = await Promise.all(
    libraryItems.map(async (li) => {
      const product = li.products as any;
      if (!product) return null;

      const coverUrl = await getSignedCoverUrl(product.cover_image_key);
      const files = (productFiles || [])
        .filter((f) => f.product_id === li.product_id)
        .map((f) => ({
          id: f.id,
          file_name: f.file_name,
          r2_key: f.r2_key,
          file_type: f.file_type,
        }));

      const progress = (progressRows || [])
        .filter((p) => p.product_id === li.product_id)
        .map((p) => ({
          file_id: p.product_file_id,
          position: Number(p.position_seconds),
          duration: Number(p.duration_seconds),
          completed: p.completed,
        }));

      return {
        id: li.id,
        product_id: li.product_id,
        title: product.title,
        cover_url: coverUrl,
        access_type: li.access_type,
        files,
        progress,
      };
    })
  );

  return NextResponse.json({ items: items.filter(Boolean) });
}
