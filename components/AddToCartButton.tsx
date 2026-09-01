"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem, lines } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const inCart = lines.some((l) => l.productId === product.id);

  const handleClick = () => {
    if (inCart) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      priceCents: product.price_cents,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <button
      onClick={handleClick}
      disabled={inCart}
      className="btn-3d w-full px-8 py-4 font-mono text-[11px] uppercase tracking-eyebrow hover:bg-transparent hover:text-gold disabled:cursor-default disabled:translate-y-0 disabled:border-white/20 disabled:bg-transparent disabled:text-bone/50 disabled:shadow-none sm:w-auto"
    >
      {inCart ? "In Cart" : justAdded ? "Added ✓" : "Add to Cart"}
    </button>
  );
}
