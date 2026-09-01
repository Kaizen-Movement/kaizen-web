"use client";

import { useState } from "react";
import Papa from "papaparse";
import Link from "next/link";

interface ConflictRow {
  slug: string;
  incomingTitle: string;
  existingTitle: string;
  existingId: string;
}

interface PreviewResult {
  totalRows: number;
  validRows: number;
  newCount: number;
  conflicts: ConflictRow[];
}

interface CommitResult {
  created: number;
  updated: number;
  skipped: number;
  duplicated: number;
  errors: string[];
}

export default function ProductImportPage() {
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [strategy, setStrategy] = useState<"skip" | "replace" | "duplicate">("skip");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    setPreview(null);
    setResult(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsed) => {
        setRows(parsed.data);
        setIsLoading(true);
        try {
          const res = await fetch("/api/admin/products/import/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: parsed.data }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setPreview(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to preview file.");
        } finally {
          setIsLoading(false);
        }
      },
      error: (err) => setError(err.message),
    });
  };

  const handleCommit = async () => {
    if (!rows) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/products/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, strategy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p className="eyebrow mb-2">Catalog</p>
      <h1 className="mb-2 font-display text-3xl text-bone">Import Products</h1>
      <p className="mb-8 max-w-xl text-sm text-bone/50">
        Upload a Shopify-format product export CSV (Handle, Title, Body (HTML),
        Type, Tags, Variant Price, Status, Image Src columns). Products are
        matched against your existing catalog by slug (derived from Handle).
      </p>

      {!preview && !result && (
        <div className="max-w-md border border-white/10 bg-charcoal p-6">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="text-sm text-bone/70"
          />
          {isLoading && (
            <p className="mt-3 text-xs text-bone/40">Analyzing file...</p>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-crimson">{error}</p>}

      {preview && !result && (
        <div className="max-w-2xl">
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="border border-white/10 bg-charcoal p-4">
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">
                Total Rows
              </p>
              <p className="mt-1 font-display text-2xl text-bone">
                {preview.totalRows}
              </p>
            </div>
            <div className="border border-white/10 bg-charcoal p-4">
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">
                New Products
              </p>
              <p className="mt-1 font-display text-2xl text-gold">
                {preview.newCount}
              </p>
            </div>
            <div className="border border-white/10 bg-charcoal p-4">
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">
                Conflicts
              </p>
              <p className="mt-1 font-display text-2xl text-crimson">
                {preview.conflicts.length}
              </p>
            </div>
          </div>

          {preview.conflicts.length > 0 && (
            <div className="mb-6">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
                {preview.conflicts.length} product{preview.conflicts.length === 1 ? "" : "s"} already exist{preview.conflicts.length === 1 ? "s" : ""} in your store
              </p>
              <div className="max-h-64 overflow-y-auto border border-white/10">
                {preview.conflicts.map((c) => (
                  <div
                    key={c.slug}
                    className="border-b border-white/5 p-3 text-sm last:border-0"
                  >
                    <p className="text-bone">{c.existingTitle}</p>
                    <p className="text-xs text-bone/40">slug: {c.slug}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
                  For all conflicts above, choose:
                </p>
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      { value: "skip", label: "Skip — leave existing untouched" },
                      { value: "replace", label: "Replace — update existing product" },
                      { value: "duplicate", label: "Store as new — add duplicate" },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className={`cursor-pointer border px-4 py-2 font-mono text-[11px] uppercase tracking-eyebrow ${
                        strategy === opt.value
                          ? "border-gold text-gold"
                          : "border-white/15 text-bone/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="strategy"
                        value={opt.value}
                        checked={strategy === opt.value}
                        onChange={() => setStrategy(opt.value)}
                        className="hidden"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleCommit}
            disabled={isLoading}
            className="border border-gold bg-gold px-6 py-3 font-mono text-[11px] uppercase tracking-eyebrow text-void hover:bg-transparent hover:text-gold disabled:opacity-50"
          >
            {isLoading ? "Importing..." : "Confirm Import"}
          </button>
        </div>
      )}

      {result && (
        <div className="max-w-md border border-gold/30 bg-charcoal p-6">
          <p className="mb-4 font-display text-xl text-bone">Import Complete</p>
          <ul className="space-y-1 text-sm text-bone/70">
            <li>{result.created} new products created</li>
            <li>{result.updated} existing products replaced</li>
            <li>{result.duplicated} stored as new duplicates</li>
            <li>{result.skipped} skipped</li>
          </ul>
          {result.errors.length > 0 && (
            <div className="mt-4">
              <p className="font-mono text-[11px] uppercase tracking-eyebrow text-crimson">
                Errors
              </p>
              {result.errors.map((e, i) => (
                <p key={i} className="mt-1 text-xs text-crimson">{e}</p>
              ))}
            </div>
          )}
          <Link
            href="/admin/products"
            className="mt-6 inline-block font-mono text-[11px] uppercase tracking-eyebrow text-gold underline underline-offset-4"
          >
            View Products →
          </Link>
        </div>
      )}
    </div>
  );
}
