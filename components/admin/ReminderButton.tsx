"use client";

import { useState, useTransition } from "react";
import { resendCheckoutReminder } from "@/lib/actions/orders";

export function ReminderButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await resendCheckoutReminder(orderId);
      setMessage(result.success ? "Sent." : result.error ?? "Failed.");
    });
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="border border-gold px-4 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-gold hover:bg-gold hover:text-void disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Send Reminder"}
      </button>
      {message && <p className="mt-1 text-[10px] text-bone/40">{message}</p>}
    </div>
  );
}
