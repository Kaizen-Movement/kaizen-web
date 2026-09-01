"use client";

import { useMemo, useRef, useState } from "react";
import {
  matchFilenameToProduct,
  type MatchableProduct,
  type MatchResult,
} from "@/lib/bulk-upload-match";

type RowStatus =
  | "queued" // strong match, waiting to upload
  | "uploading"
  | "done"
  | "error"
  | "needs_review"; // ambiguous or no match — not uploaded

interface Row {
  file: File;
  match: MatchResult;
  assignedProductId: string | null; // set once auto-matched or manually picked
  status: RowStatus;
  errorMessage?: string;
}

const CONCURRENCY = 3;

function classifyFileType(file: File): string {
  if (file.type?.startsWith("audio")) return "audio";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "software";
}

export function BulkAudioUploader({
  products,
}: {
  products: MatchableProduct[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const productById = useMemo(() => {
    const map = new Map<string, MatchableProduct>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList);

    const newRows: Row[] = files.map((file) => {
      const match = matchFilenameToProduct(file.name, products);
      const assignedProductId =
        match.status === "strong" ? match.best!.product.id : null;
      return {
        file,
        match,
        assignedProductId,
        status: match.status === "strong" ? "queued" : "needs_review",
      };
    });

    setRows(newRows);
    setHasRun(false);
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );
  }

  async function uploadOne(index: number, row: Row) {
    if (!row.assignedProductId) return;
    updateRow(index, { status: "uploading" });

    try {
      const presignRes = await fetch("/api/admin/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: row.assignedProductId,
          kind: "deliverable",
          fileName: row.file.name,
          contentType: row.file.type || "application/octet-stream",
          fileSize: row.file.size,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error);

      const putRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": row.file.type || "application/octet-stream",
        },
        body: row.file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed.");

      const completeRes = await fetch("/api/admin/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: row.assignedProductId,
          kind: "deliverable",
          key: presignData.key,
          fileName: row.file.name,
          fileType: classifyFileType(row.file),
          fileSize: row.file.size,
        }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeData.error);

      updateRow(index, { status: "done" });
    } catch (err) {
      updateRow(index, {
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Upload failed.",
      });
    }
  }

  async function runUploads() {
    setIsRunning(true);

    const queueIndexes = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.status === "queued")
      .map(({ i }) => i);

    let cursor = 0;
    async function worker() {
      while (cursor < queueIndexes.length) {
        const myIndex = queueIndexes[cursor];
        cursor += 1;
        await uploadOne(myIndex, rows[myIndex]);
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queueIndexes.length) }, () =>
        worker()
      )
    );

    setIsRunning(false);
    setHasRun(true);
  }

  const strongCount = rows.filter(
    (r) => r.match.status === "strong"
  ).length;
  const needsReviewCount = rows.filter(
    (r) => r.status === "needs_review"
  ).length;
  const doneCount = rows.filter((r) => r.status === "done").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center border border-dashed border-white/20 px-6 py-12 text-center"
      >
        <p className="text-sm text-bone/60">
          Drag and drop audio or PDF files here, or
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 border border-gold px-5 py-2.5 font-mono text-[11px] uppercase tracking-eyebrow text-gold hover:bg-gold hover:text-void"
        >
          Choose Files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="audio/*,application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {rows.length > 0 && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
              {rows.length} file{rows.length === 1 ? "" : "s"} selected ·{" "}
              {strongCount} matched · {needsReviewCount} need review
              {hasRun && ` · ${doneCount} uploaded · ${errorCount} failed`}
            </p>
            <button
              type="button"
              onClick={runUploads}
              disabled={isRunning || strongCount === 0}
              className="border border-gold bg-gold px-5 py-2.5 font-mono text-[11px] uppercase tracking-eyebrow text-void hover:bg-transparent hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isRunning
                ? "Uploading..."
                : `Upload ${strongCount} Matched File${strongCount === 1 ? "" : "s"}`}
            </button>
          </div>

          <div className="mt-4 divide-y divide-white/10 border border-white/10">
            {rows.map((row, i) => (
              <RowView
                key={`${row.file.name}-${i}`}
                row={row}
                products={products}
                productById={productById}
                onReassign={(productId) =>
                  updateRow(i, {
                    assignedProductId: productId,
                    status: productId ? "queued" : "needs_review",
                  })
                }
              />
            ))}
          </div>

          {hasRun && needsReviewCount > 0 && (
            <div className="mt-6 border border-crimson/40 bg-crimson/5 p-4">
              <p className="font-mono text-[11px] uppercase tracking-eyebrow text-crimson">
                {needsReviewCount} file{needsReviewCount === 1 ? "" : "s"}{" "}
                still need a product assigned
              </p>
              <p className="mt-1 text-xs text-bone/50">
                Pick a product from the dropdown next to each one above, then
                click Upload again — only newly-assigned files will upload.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RowView({
  row,
  products,
  productById,
  onReassign,
}: {
  row: Row;
  products: MatchableProduct[];
  productById: Map<string, MatchableProduct>;
  onReassign: (productId: string | null) => void;
}) {
  const assignedProduct = row.assignedProductId
    ? productById.get(row.assignedProductId)
    : null;

  return (
    <div className="flex items-center justify-between gap-4 p-3 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate text-bone">{row.file.name}</p>
        <p className="mt-0.5 text-xs text-bone/40">
          {(row.file.size / (1024 * 1024)).toFixed(1)} MB
          {row.match.status === "none" && " · no matching product found"}
          {row.match.status === "ambiguous" &&
            row.match.candidates.length > 1 &&
            ` · ambiguous — could be ${row.match.candidates
              .slice(0, 2)
              .map((c) => c.product.title)
              .join(" or ")}`}
          {row.status === "error" && ` · ${row.errorMessage}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {row.status === "needs_review" ? (
          <select
            value={row.assignedProductId ?? ""}
            onChange={(e) => onReassign(e.target.value || null)}
            className="border border-white/20 bg-void px-2 py-1.5 font-mono text-[11px] text-bone/70"
          >
            <option value="">Assign product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        ) : (
          <span className="max-w-[160px] truncate font-mono text-[11px] text-bone/50">
            {assignedProduct?.title ?? "—"}
          </span>
        )}

        <StatusBadge status={row.status} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: RowStatus }) {
  const styles: Record<RowStatus, string> = {
    queued: "text-bone/50",
    uploading: "text-gold",
    done: "text-green-400",
    error: "text-crimson",
    needs_review: "text-crimson/70",
  };
  const labels: Record<RowStatus, string> = {
    queued: "Ready",
    uploading: "Uploading...",
    done: "Uploaded",
    error: "Failed",
    needs_review: "Needs Review",
  };
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-eyebrow ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
