"use client";

import { useTransition } from "react";

export function DeleteFileButton({
  fileId,
  onDelete,
}: {
  fileId: string;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this file? This can't be undone.")) return;
        startTransition(() => onDelete(fileId));
      }}
      className="font-mono text-[11px] uppercase tracking-eyebrow text-crimson hover:text-red-400 disabled:opacity-50"
    >
      {isPending ? "..." : "Delete"}
    </button>
  );
}
