"use client";

import { useTransition } from "react";
import { deleteProduct } from "@/lib/actions/products";

export function DeleteProductButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!confirm("Delete this product? This can't be undone.")) return;
    startTransition(() => deleteProduct(productId));
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="font-mono text-[11px] uppercase tracking-eyebrow text-crimson hover:text-red-400 disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
