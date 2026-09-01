import "server-only";

export interface RawImportRow {
  Handle?: string;
  Title?: string;
  "Body (HTML)"?: string;
  Type?: string;
  Tags?: string;
  "Variant Price"?: string;
  "Variant Compare At Price"?: string;
  Status?: string;
  "Image Src"?: string;
  [key: string]: string | undefined;
}

export interface MappedProductRow {
  slug: string;
  title: string;
  kind: "subliminal" | "software";
  categorySlug: string | null;
  short_description: string;
  long_description: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  status: "published" | "draft";
  legacy_image_url: string | null;
}

function stripHtml(raw: string | undefined): string {
  if (!raw) return "";
  const text = raw.replace(/<[^>]+>/g, " ");
  const withEntities = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  return withEntities.replace(/\s+/g, " ").trim();
}

// Sanitizes to a clean, URL-safe ASCII slug — strips emoji/unicode symbols
// that broke one imported product's URL previously.
export function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "") // strip anything non-ASCII (emoji, symbols)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function pickCategorySlug(row: RawImportRow): string | null {
  const type = (row.Type || "").toLowerCase();
  const tags = (row.Tags || "").toLowerCase();

  if (type.includes("attraction") || tags.includes("attraction")) return "attraction";
  if (type.includes("improvement") || tags.includes("improvement")) return "self-improvement";
  if (type.includes("lifestyle") || tags.includes("lifestyle")) return "lifestyle";
  if (type.includes("software") || tags.includes("software")) return "software";
  return null;
}

export function mapImportRow(row: RawImportRow): MappedProductRow | null {
  const rawSlug = (row.Handle || "").trim();
  const title = (row.Title || "").trim();
  if (!rawSlug || !title) return null;

  const slug = sanitizeSlug(rawSlug) || sanitizeSlug(title);
  const longDescription = stripHtml(row["Body (HTML)"]);
  const shortDescription =
    longDescription.length > 180
      ? longDescription.slice(0, 180).split(" ").slice(0, -1).join(" ") + "…"
      : longDescription;

  const price = parseFloat(row["Variant Price"] || "0");
  const compare = parseFloat(row["Variant Compare At Price"] || "");

  const kind: "subliminal" | "software" =
    /e-?book/i.test(title) ? "software" : "subliminal";

  return {
    slug,
    title,
    kind,
    categorySlug: pickCategorySlug(row),
    short_description: shortDescription,
    long_description: longDescription,
    price_cents: Number.isFinite(price) ? Math.round(price * 100) : 0,
    compare_at_price_cents: Number.isFinite(compare) ? Math.round(compare * 100) : null,
    status: (row.Status || "").trim().toLowerCase() === "active" ? "published" : "draft",
    legacy_image_url: (row["Image Src"] || "").trim() || null,
  };
}
