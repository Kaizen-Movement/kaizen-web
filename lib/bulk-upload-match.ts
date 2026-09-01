export interface MatchableProduct {
  id: string;
  title: string;
  slug: string;
}

export interface MatchCandidate {
  product: MatchableProduct;
  score: number; // 0..1 — fraction of the product's distinctive words found in the filename
}

export interface MatchResult {
  status: "strong" | "ambiguous" | "none";
  best: MatchCandidate | null;
  candidates: MatchCandidate[]; // top candidates, for showing "did you mean" in ambiguous/none cases
}

// Words that show up in filenames but carry no product-identifying signal.
// Kept intentionally small and audio-specific rather than a generic stopword
// list, since over-stripping could accidentally erase real product words.
const NOISE_WORDS = new Set([
  "subliminal",
  "subliminals",
  "audio",
  "track",
  "file",
  "files",
  "final",
  "finalmix",
  "master",
  "mastered",
  "mix",
  "mixdown",
  "version",
  "ver",
  "download",
  "kaizen",
  "copy",
  "new",
  "updated",
  "revised",
  "wav",
  "mp3",
  "m4a",
  "flac",
  "aiff",
]);

// Matches standalone version-ish tokens like "v1", "v2", "2024", "01" so
// they don't get treated as meaningful product words.
const VERSION_OR_NUMBER = /^(v?\d+|20\d{2})$/i;

export function normalizeToTokens(raw: string): string[] {
  const withoutExtension = raw.replace(/\.[a-z0-9]{2,5}$/i, "");
  // Split camelCase / PascalCase boundaries (e.g. "SmoothTalker" -> "Smooth Talker")
  // before lowercasing, since filenames are often squished together with no
  // separator at all.
  const camelSplit = withoutExtension.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  const spaced = camelSplit
    .toLowerCase()
    .replace(/[_\-.]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ");

  return spaced
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !NOISE_WORDS.has(t))
    .filter((t) => !VERSION_OR_NUMBER.test(t));
}

function scoreAgainst(fileTokens: Set<string>, productTokens: string[]): number {
  if (productTokens.length === 0) return 0;
  const matched = productTokens.filter((t) => fileTokens.has(t)).length;
  return matched / productTokens.length;
}

const STRONG_THRESHOLD = 0.8;
const MIN_THRESHOLD = 0.5;
const AMBIGUOUS_GAP = 0.15; // if #1 and #2 scores are within this, treat as ambiguous

export function matchFilenameToProduct(
  fileName: string,
  products: MatchableProduct[]
): MatchResult {
  const fileTokens = new Set(normalizeToTokens(fileName));

  const candidates: MatchCandidate[] = products
    .map((product) => {
      const productTokens = normalizeToTokens(product.title);
      const slugTokens = product.slug.split("-").filter(Boolean);
      // Score against title tokens and slug tokens, take the better of the two —
      // titles are more human-readable but slugs are sometimes closer to how
      // files actually get named (e.g. "wealth-magnet" vs "Wealth Magnet™").
      const titleScore = scoreAgainst(fileTokens, productTokens);
      const slugScore = scoreAgainst(fileTokens, slugTokens);
      return { product, score: Math.max(titleScore, slugScore) };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return { status: "none", best: null, candidates: [] };
  }

  const top = candidates[0];
  const second = candidates[1];

  if (top.score < MIN_THRESHOLD) {
    return { status: "none", best: null, candidates: candidates.slice(0, 3) };
  }

  const isTiedWithSecond =
    second !== undefined && top.score - second.score < AMBIGUOUS_GAP;

  if (top.score >= STRONG_THRESHOLD && !isTiedWithSecond) {
    return { status: "strong", best: top, candidates: candidates.slice(0, 3) };
  }

  return { status: "ambiguous", best: top, candidates: candidates.slice(0, 3) };
}
