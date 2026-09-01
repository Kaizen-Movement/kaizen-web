"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "alpha", label: "Alphabetical" },
];

export function SearchFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 border-y border-white/10 py-4">
      <select
        defaultValue={searchParams.get("category") ?? ""}
        onChange={(e) => setParam("category", e.target.value)}
        className="border border-white/15 bg-void px-3 py-2 font-mono text-[11px] uppercase tracking-eyebrow text-bone/70"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("sort") ?? "newest"}
        onChange={(e) => setParam("sort", e.target.value)}
        className="border border-white/15 bg-void px-3 py-2 font-mono text-[11px] uppercase tracking-eyebrow text-bone/70"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("price") ?? ""}
        onChange={(e) => setParam("price", e.target.value)}
        className="border border-white/15 bg-void px-3 py-2 font-mono text-[11px] uppercase tracking-eyebrow text-bone/70"
      >
        <option value="">Any Price</option>
        <option value="0-2500">Under $25</option>
        <option value="2500-5000">$25 – $50</option>
        <option value="5000-99999999">$50+</option>
      </select>
    </div>
  );
}
