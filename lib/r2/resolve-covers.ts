import "server-only";
import { getSignedCoverUrls } from "./storage";
import type { Product } from "@/lib/types";

export async function resolveCoverUrls(
  products: Product[]
): Promise<Record<string, string | null>> {
  const map: Record<string, string | null> = {};
  const keys = products.map((p) => p.cover_image_key);

  // If R2 isn't configured yet (no credentials set), or any other storage
  // error occurs, degrade to placeholders rather than crashing the page —
  // cover art is enhancement, not a hard dependency for browsing/buying.
  try {
    const urls = await getSignedCoverUrls(keys);
    products.forEach((p, i) => {
      map[p.id] = urls[i];
    });
  } catch {
    products.forEach((p) => {
      map[p.id] = null;
    });
  }

  return map;
}
