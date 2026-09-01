"use client";

import { useState, useTransition } from "react";
import { resendOrderEmail, regenerateDownloadToken } from "@/lib/actions/orders";

export function ResendEmailButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await resendOrderEmail(orderId);
      setMessage(result.success ? "Email sent." : result.error ?? "Failed.");
    });
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="border border-gold px-5 py-2.5 font-mono text-[11px] uppercase tracking-eyebrow text-gold hover:bg-gold hover:text-void disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Resend Confirmation Email"}
      </button>
      {message && (
        <p className="mt-2 text-xs text-bone/50">{message}</p>
      )}
    </div>
  );
}

export function RegenerateTokenButton({
  tokenId,
  orderId,
}: {
  tokenId: string;
  orderId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    if (
      !confirm(
        "This invalidates the current download link and creates a fresh one. The old link will stop working immediately. Continue?"
      )
    )
      return;

    setMessage(null);
    startTransition(async () => {
      const result = await regenerateDownloadToken(tokenId, orderId);
      setMessage(
        result.success
          ? "New link generated — use Resend Email to deliver it."
          : result.error ?? "Failed."
      );
    });
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="font-mono text-[10px] uppercase tracking-eyebrow text-bone/50 hover:text-gold disabled:opacity-50"
      >
        {isPending ? "Regenerating..." : "Regenerate Link"}
      </button>
      {message && <p className="mt-1 text-[10px] text-bone/40">{message}</p>}
    </div>
  );
}
