import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mapImportRow, type RawImportRow } from "@/lib/csv-import";

type Strategy = "skip" | "replace" | "duplicate";

export async function POST(request: Request) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { rows, strategy } = (await request.json()) as {
    rows: RawImportRow[];
    strategy: Strategy;
  };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided." }, { status: 400 });
  }
  if (!["skip", "replace", "duplicate"].includes(strategy)) {
    return NextResponse.json({ error: "Invalid strategy." }, { status: 400 });
  }

  const mapped = rows
    .map(mapImportRow)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const supabase = createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug");
  const categoryMap = new Map((categories ?? []).map((c) => [c.slug, c.id]));

  const { data: existing } = await supabase
    .from("products")
    .select("id, slug")
    .in("slug", mapped.map((r) => r.slug));
  const existingBySlug = new Map((existing ?? []).map((p) => [p.slug, p.id]));

  // For generating unique slugs when duplicating.
  const { data: allSlugsData } = await supabase.from("products").select("slug");
  const allSlugs = new Set((allSlugsData ?? []).map((p) => p.slug));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let duplicated = 0;
  const errors: string[] = [];

  for (const row of mapped) {
    const categoryId = row.categorySlug ? categoryMap.get(row.categorySlug) ?? null : null;
    const existingId = existingBySlug.get(row.slug);

    const basePayload = {
      title: row.title,
      kind: row.kind,
      category_id: categoryId,
      short_description: row.short_description,
      long_description: row.long_description,
      price_cents: row.price_cents,
      compare_at_price_cents: row.compare_at_price_cents,
      status: row.status,
      legacy_image_url: row.legacy_image_url,
      import_source: "csv_import",
    };

    if (!existingId) {
      // No conflict — always insert.
      const { error } = await supabase
        .from("products")
        .insert({ ...basePayload, slug: row.slug });
      if (error) errors.push(`${row.slug}: ${error.message}`);
      else {
        created++;
        allSlugs.add(row.slug);
      }
      continue;
    }

    // Conflict — apply chosen strategy.
    if (strategy === "skip") {
      skipped++;
      continue;
    }

    if (strategy === "replace") {
      // Deliberately does NOT touch cover_image_key, faq, is_featured,
      // is_recommended, or sort_order — preserves admin curation/uploads
      // that a re-import shouldn't silently wipe out.
      const { error } = await supabase
        .from("products")
        .update(basePayload)
        .eq("id", existingId);
      if (error) errors.push(`${row.slug}: ${error.message}`);
      else updated++;
      continue;
    }

    if (strategy === "duplicate") {
      let candidateSlug = row.slug;
      let suffix = 2;
      while (allSlugs.has(candidateSlug)) {
        candidateSlug = `${row.slug}-${suffix}`;
        suffix++;
      }
      const { error } = await supabase
        .from("products")
        .insert({ ...basePayload, slug: candidateSlug });
      if (error) errors.push(`${row.slug}: ${error.message}`);
      else {
        duplicated++;
        allSlugs.add(candidateSlug);
      }
    }
  }

  return NextResponse.json({ created, updated, skipped, duplicated, errors });
}
