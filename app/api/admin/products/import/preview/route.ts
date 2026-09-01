import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mapImportRow, type RawImportRow } from "@/lib/csv-import";

export async function POST(request: Request) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { rows } = (await request.json()) as { rows: RawImportRow[] };
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided." }, { status: 400 });
  }

  const mapped = rows
    .map(mapImportRow)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (mapped.length === 0) {
    return NextResponse.json(
      { error: "No valid rows found — check the file has Handle and Title columns." },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const slugs = mapped.map((r) => r.slug);

  const { data: existing, error } = await supabase
    .from("products")
    .select("id, slug, title")
    .in("slug", slugs);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const existingBySlug = new Map((existing ?? []).map((p) => [p.slug, p]));

  const conflicts = mapped
    .filter((r) => existingBySlug.has(r.slug))
    .map((r) => ({
      slug: r.slug,
      incomingTitle: r.title,
      existingTitle: existingBySlug.get(r.slug)!.title,
      existingId: existingBySlug.get(r.slug)!.id,
    }));

  const newCount = mapped.length - conflicts.length;

  return NextResponse.json({
    totalRows: rows.length,
    validRows: mapped.length,
    newCount,
    conflicts,
  });
}
