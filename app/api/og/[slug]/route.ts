import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSignedCoverUrl } from "@/lib/r2/storage";

// Social crawlers (Facebook, Twitter/X, Slack, iMessage, etc.) need a
// stable URL to put in og:image / twitter:image — but cover art lives in a
// private R2 bucket behind short-lived signed URLs (see lib/r2/storage.ts).
// This route is the stable URL: every time a crawler hits it, it looks up
// the current signed URL and 302-redirects to it, so the crawler always
// gets a working image regardless of when it (re)scrapes the page.
export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("cover_image_key")
    .eq("slug", params.slug)
    .eq("status", "published")
    .maybeSingle();

  if (!product?.cover_image_key) {
    return NextResponse.redirect(
      new URL("/kaizen-seal.png", "https://kaizensubliminals.store")
    );
  }

  try {
    const signedUrl = await getSignedCoverUrl(product.cover_image_key);
    if (!signedUrl) throw new Error("No signed URL returned.");
    return NextResponse.redirect(signedUrl);
  } catch {
    return NextResponse.redirect(
      new URL("/kaizen-seal.png", "https://kaizensubliminals.store")
    );
  }
}
