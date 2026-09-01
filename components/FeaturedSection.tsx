import Link from "next/link";
import { SealMark } from "./SealMark";
import { ProductCard } from "./ProductCard";
import type { HomepageFeaturedPanel, Product } from "@/lib/types";

export function FeaturedSection({
  panel,
  products,
  coverUrls = {},
}: {
  panel: HomepageFeaturedPanel;
  products: Product[];
  coverUrls?: Record<string, string | null>;
}) {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 pt-16 lg:px-10">
        <p className="eyebrow">Featured</p>
        <Link
          href="/collections/all"
          className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/60 transition-colors hover:text-gold"
        >
          View All →
        </Link>
      </div>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[380px_1fr] lg:px-10">
        {/* Left: featured panel */}
        <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden border border-gold/20 bg-gradient-to-br from-burgundy via-burgundy-deep to-void p-8">
          <SealMark
            className="pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 text-gold/10"
          />
          <p className="eyebrow">Kaizen Collection</p>
          <div>
            <h2 className="font-impact text-5xl uppercase leading-[0.9] text-bone">
              {panel.title}
            </h2>
            {panel.description && (
              <p className="mt-4 max-w-xs text-sm text-bone/60">
                {panel.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: product grid */}
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} coverUrl={coverUrls[product.id] ?? null} />
          ))}
        </div>
      </div>
    </section>
  );
}
