"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface UploadStatus {
  name: string;
  state: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export function BulkUploadUnassigned() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [statuses, setStatuses] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadOne = async (file: File) => {
    const presignRes = await fetch("/api/admin/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    setStatuses(fileArray.map((f) => ({ name: f.name, state: "pending" })));
    setIsUploading(true);

    for (let i = 0; i < fileArray.length; i++) {
      setStatuses((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, state: "uploading" } : s))
      );
      try {
        await uploadOne(fileArray[i]);
        setStatuses((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, state: "done" } : s))
        );
      } catch (err) {
        setStatuses((prev) =>
          prev.map((s, idx) =>
            idx === i
              ? {
                  ...s,
                  state: "error",
                  error: err instanceof Error ? err.message : "Failed",
                }
              : s
          )
        );
      }
    }

    setIsUploading(false);
    router.refresh();
  };

  return (
    <div className="border border-white/10 bg-charcoal p-6">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
        Bulk Upload
      </p>
      <p className="mb-4 text-xs text-bone/40">
        Upload audio or software files without assigning them to a product
        yet — attach them from any product&apos;s edit page later.
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
          }
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="border border-gold px-5 py-2.5 font-mono text-[11px] uppercase tracking-eyebrow text-gold hover:bg-gold hover:text-void disabled:opacity-50"
      >
        {isUploading ? "Uploading..." : "+ Select Files"}
      </button>

      {statuses.length > 0 && (
        <div className="mt-4 space-y-1">
          {statuses.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-bone/70">{s.name}</span>
              <span
                className={
                  s.state === "done"
                    ? "text-gold"
                    : s.state === "error"
                      ? "text-crimson"
                      : "text-bone/40"
                }
              >
                {s.state === "done"
                  ? "Done ✓"
                  : s.state === "error"
                    ? s.error
                    : s.state === "uploading"
                      ? "Uploading..."
                      : "Waiting..."}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
