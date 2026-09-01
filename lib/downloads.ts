import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSignedDownloadUrl } from "@/lib/r2/storage";

export type RedeemResult =
  | { ok: true; url: string; fileName: string; productTitle: string }
  | { ok: false; reason: "not_found" | "expired" | "limit_reached" };

/**
 * Redeems a download token: validates it, enforces expiry + max-download
 * limits, logs the attempt, and returns a short-lived signed R2 URL.
 * Uses the admin (service-role) client deliberately — the token VALUE
 * itself is the credential here, not a Supabase Auth session, so this
 * intentionally bypasses RLS after doing its own authorization checks.
 */
export async function redeemDownloadToken(
  token: string,
  ip: string | null,
  userAgent: string | null
): Promise<RedeemResult> {
  const admin = createAdminClient();

  const { data: tokenRow, error } = await admin
    .from("download_tokens")
    .select(
      "id, expires_at, max_downloads, download_count, product_file_id, order_item_id"
    )
    .eq("token", token)
    .maybeSingle();

  if (error || !tokenRow) {
    return { ok: false, reason: "not_found" };
  }

  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if (tokenRow.download_count >= tokenRow.max_downloads) {
    return { ok: false, reason: "limit_reached" };
  }

  const { data: fileRow } = await admin
    .from("product_files")
    .select("r2_key, file_name, product_id")
    .eq("id", tokenRow.product_file_id)
    .maybeSingle();

  if (!fileRow) {
    return { ok: false, reason: "not_found" };
  }

  const { data: productRow } = await admin
    .from("products")
    .select("title")
    .eq("id", fileRow.product_id)
    .maybeSingle();

  const url = await getSignedDownloadUrl(fileRow.r2_key);

  // Best-effort bookkeeping — a logging failure shouldn't block a paying
  // customer from getting their file.
  await admin
    .from("download_tokens")
    .update({ download_count: tokenRow.download_count + 1 })
    .eq("id", tokenRow.id);

  await admin.from("download_history").insert({
    download_token_id: tokenRow.id,
    ip_address: ip,
    user_agent: userAgent,
  });

  return {
    ok: true,
    url,
    fileName: fileRow.file_name,
    productTitle: productRow?.title ?? "Your download",
  };
}
