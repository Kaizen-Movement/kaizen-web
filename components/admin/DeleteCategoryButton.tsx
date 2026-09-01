"use client";

import { useTransition } from "react";

export function DeleteCategoryButton({
  categoryId,
  onDelete,
}: {
  categoryId: string;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!confirm("Delete this category? Products in it will become uncategorized.")) return;
    startTransition(() => onDelete(categoryId));
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="font-mono text-[11px] uppercase tracking-eyebrow text-crimson hover:text-red-400 disabled:opacity-50"
    >
      {isPending ? "..." : "Delete"}
    </button>
  );
}
