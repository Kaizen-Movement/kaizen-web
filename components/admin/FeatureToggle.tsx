"use client";

import { useTransition } from "react";
import { toggleFeatured } from "@/lib/actions/products";

export function FeatureToggle({
  productId,
  isFeatured,
}: {
  productId: string;
  isFeatured: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(() => toggleFeatured(productId, !isFeatured))
      }
      disabled={isPending}
      aria-pressed={isFeatured}
      className={`font-mono text-[10px] uppercase tracking-eyebrow ${
        isFeatured ? "text-gold" : "text-bone/30"
      } disabled:opacity-50`}
    >
      {isFeatured ? "Featured" : "—"}
    </button>
  );
}
