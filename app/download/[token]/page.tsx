"use client";

import { useState } from "react";
import Link from "next/link";
import { SealMark } from "@/components/SealMark";

export default function DownloadPage({
  params,
}: {
  params: { token: string };
}) {
  const [state, setState] = useState<
    "idle" | "loading" | "error" | "done"
  >("idle");
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState<string | null>(null);

  const handleDownload = async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/download/${params.token}`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorReason(data.error ?? "unknown");
        setState("error");
        return;
      }

      setProductTitle(data.productTitle);
      setState("done");
      window.location.href = data.url;
    } catch {
      setErrorReason("unknown");
      setState("error");
    }
  };

  const errorMessages: Record<string, string> = {
    not_found: "This download link isn't valid.",
    expired: "This download link has expired.",
    limit_reached: "This link has reached its download limit.",
    unknown: "Something went wrong. Please try again.",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-6">
      <div className="w-full max-w-sm text-center">
        <SealMark className="mx-auto h-10 w-10 text-gold" />

        {state === "idle" && (
          <>
            <p className="mt-6 font-display text-2xl text-bone">
              Your Kaizen Download
            </p>
            <p className="mt-2 text-sm text-bone/50">
              Click below to receive your file. This link has a limited
              number of uses.
            </p>
            <button
              onClick={handleDownload}
              className="mt-8 w-full border border-gold bg-gold py-3 font-mono text-[11px] uppercase tracking-eyebrow text-void transition-colors hover:bg-transparent hover:text-gold"
            >
              Download Now
            </button>
          </>
        )}

        {state === "loading" && (
          <p className="mt-6 text-sm text-bone/50">Preparing your file...</p>
        )}

        {state === "done" && (
          <>
            <p className="mt-6 font-display text-xl text-bone">
              {productTitle}
            </p>
            <p className="mt-2 text-sm text-bone/50">
              Your download should begin automatically. If it doesn&apos;t,{" "}
              <button
                onClick={handleDownload}
                className="text-gold underline underline-offset-2"
              >
                click here
              </button>
              .
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <p className="mt-6 font-display text-xl text-bone">
              {errorMessages[errorReason ?? "unknown"]}
            </p>
            <p className="mt-3 text-sm text-bone/50">
              If you believe this is a mistake, contact support and we&apos;ll
              generate a new link.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block font-mono text-[11px] uppercase tracking-eyebrow text-gold underline underline-offset-4"
            >
              Return Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
