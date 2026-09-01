"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function CoverImageUpload({
  productId,
  currentCoverUrl,
}: {
  productId: string;
  currentCoverUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentCoverUrl);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const presignRes = await fetch("/api/admin/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          kind: "cover",
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error);

      const putRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed.");

      const completeRes = await fetch("/api/admin/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          kind: "cover",
          key: presignData.key,
        }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeData.error);

      setPreview(URL.createObjectURL(file));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label className="mb-1 block font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
        Cover Image
      </label>
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden border border-white/15 bg-void">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-bone/30">None</span>
          )}
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
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
            {isUploading ? "Uploading..." : "Upload Image"}
          </button>
          {error && <p className="mt-2 text-xs text-crimson">{error}</p>}
        </div>
      </div>
    </div>
  );
}
