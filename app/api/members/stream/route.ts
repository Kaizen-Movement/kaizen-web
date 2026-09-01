import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignedDownloadUrl } from "@/lib/r2/storage";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fileId = req.nextUrl.searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  const supabase = createClient();

  // Get the file and verify the user has access
  const { data: file } = await supabase
    .from("product_files")
    .select("id, r2_key, product_id, file_name")
    .eq("id", fileId)
    .maybeSingle();

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Check that the user has this product in their library
  const { data: access } = await supabase
    .from("member_library")
    .select("id")
    .eq("member_id", user.id)
    .eq("product_id", file.product_id)
    .maybeSingle();

  if (!access) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Generate a signed streaming URL (15 min TTL for streaming)
  const url = await getSignedDownloadUrl(file.r2_key);

  return NextResponse.json({ url, fileName: file.file_name });
}
