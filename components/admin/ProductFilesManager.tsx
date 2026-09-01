"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignFileToProduct } from "@/lib/actions/products";

export interface ProductFileRow {
  id: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number | null;
  version: string;
  created_at: string;
}

export interface UnassignedFileRow {
  id: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number | null;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export function ProductFilesManager({
  productId,
  files,
  unassignedFiles = [],
  onDelete,
}: {
  productId: string;
  files: ProductFileRow[];
  unassignedFiles?: UnassignedFileRow[];
  onDelete: (fileId: string) => Promise<void>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedUnassigned, setSelectedUnassigned] = useState("");
  const [isAttaching, startAttachTransition] = useTransition();

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const presignRes = await fetch("/api/admin/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          kind: "deliverable",
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error);

      const putRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed.");

      const completeRes = await fetch("/api/admin/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          kind: "deliverable",
          key: presignData.key,
          fileName: file.name,
          fileType: file.type?.startsWith("audio")
            ? "audio"
            : file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
              ? "pdf"
              : "software",
          fileSize: file.size,
        }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeData.error);

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label className="mb-2 block font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
        Deliverable Files
      </label>

      <div className="mb-3 divide-y divide-white/10 border border-white/10">
        {files.length === 0 ? (
          <p className="p-3 text-xs text-bone/40">
            No files uploaded yet — customers can&apos;t receive this product
            until at least one is added.
          </p>
        ) : (
          files.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between p-3 text-sm"
            >
              <div>
                <p className="text-bone">{f.file_name}</p>
                <p className="text-xs text-bone/40">
                  {f.file_type} · {formatBytes(f.file_size_bytes)} · v
                  {f.version}
                </p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (!confirm(`Delete ${f.file_name}?`)) return;
                  startTransition(() => onDelete(f.id));
                }}
                className="font-mono text-[10px] uppercase tracking-eyebrow text-crimson hover:text-red-400 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="border border-white/20 px-4 py-2 font-mono text-[11px] uppercase tracking-eyebrow text-bone/70 hover:border-gold hover:text-gold disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "+ Upload New File"}
        </button>
      </div>

      {unassignedFiles.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
            Or Attach From Media Library
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedUnassigned}
              onChange={(e) => setSelectedUnassigned(e.target.value)}
              className="border border-white/15 bg-void px-3 py-2 font-mono text-[11px] text-bone/70"
            >
              <option value="">Select an unassigned file...</option>
              {unassignedFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.file_name} ({formatBytes(f.file_size_bytes)})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedUnassigned || isAttaching}
              onClick={() => {
                startAttachTransition(async () => {
                  await assignFileToProduct(selectedUnassigned, productId);
                  setSelectedUnassigned("");
                  router.refresh();
                });
              }}
              className="border border-gold px-4 py-2 font-mono text-[11px] uppercase tracking-eyebrow text-gold hover:bg-gold hover:text-void disabled:opacity-30"
            >
              {isAttaching ? "Attaching..." : "Attach"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-crimson">{error}</p>}
    </div>
  );
}
