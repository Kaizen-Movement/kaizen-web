"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { Category, Product } from "@/lib/types";

export function CategoryTabsSection({
  categories,
  products,
  coverUrls = {},
}: {
  categories: Category[];
  products: Product[];
  coverUrls?: Record<string, string | null>;
}) {
  const tabCategories = categories.filter((c) => c.slug !== "software");
  const [activeSlug, setActiveSlug] = useState(tabCategories[0]?.slug ?? "");

  const filtered = useMemo(() => {
    const active = categories.find((c) => c.slug === activeSlug);
    if (!active) return products;
    return products.filter((p) => p.category_id === active.id);
  }, [activeSlug, categories, products]);

  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-[1440px] px-6 pt-16 lg:px-10">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Collections</p>
          <Link
            href="/collections/all"
            className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/60 transition-colors hover:text-gold"
          >
            View All →
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-0">
          {tabCategories.map((cat) => {
            const isActive = cat.slug === activeSlug;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveSlug(cat.slug)}
                className={`border-b-2 px-5 py-3 font-mono text-[11px] uppercase tracking-eyebrow transition-colors ${
                  isActive
                    ? "border-crimson bg-burgundy/40 text-bone"
                    : "border-transparent text-bone/50 hover:text-bone"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} coverUrl={coverUrls[product.id] ?? null} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-bone/40">
              New pieces for this collection are in progress.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
