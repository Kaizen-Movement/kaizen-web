"use client";

import { useState, useTransition } from "react";
import { assignFileToProduct } from "@/lib/actions/products";

export function AssignFileControl({
  fileId,
  products,
}: {
  fileId: string;
  products: { id: string; title: string }[];
}) {
  const [selected, setSelected] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="border border-white/15 bg-void px-2 py-1.5 font-mono text-[11px] text-bone/70"
      >
        <option value="">Assign to...</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!selected || isPending}
        onClick={() => {
          startTransition(async () => {
            await assignFileToProduct(fileId, selected);
            setDone(true);
          });
        }}
        className="font-mono text-[11px] uppercase tracking-eyebrow text-gold hover:text-bone disabled:opacity-30"
      >
        {isPending ? "..." : done ? "Assigned ✓" : "Assign"}
      </button>
    </div>
  );
}
