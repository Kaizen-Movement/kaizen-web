import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { productId, kind, key, fileName, fileType, fileSize } =
    await request.json();

  if (!kind || !key) {
    return NextResponse.json(
      { error: "kind and key are required." },
      { status: 400 }
    );
  }
  if (kind === "cover" && !productId) {
    return NextResponse.json(
      { error: "productId is required for cover uploads." },
      { status: 400 }
    );
  }

  const supabase = createClient();

  if (kind === "cover") {
    const { error } = await supabase
      .from("products")
      .update({ cover_image_key: key })
      .eq("id", productId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("product_files").insert({
      product_id: productId ?? null,
      r2_key: key,
      file_name: fileName ?? key,
      file_type: fileType ?? "audio",
      file_size_bytes: fileSize ?? null,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
