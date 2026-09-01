"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SealMark } from "@/components/SealMark";

export default function SetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    setIsSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/admin/login"), 2000);
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void px-6 text-center">
        <div>
          <SealMark className="mx-auto h-10 w-10 text-gold" />
          <p className="mt-4 font-display text-2xl text-bone">
            Admin account created
          </p>
          <p className="mt-2 text-sm text-bone/50">
            Redirecting you to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <SealMark className="h-10 w-10 text-gold" />
          <p className="mt-4 font-display text-2xl text-bone">
            Set Up Kaizen Admin
          </p>
          <p className="mt-2 text-center text-sm text-bone/50">
            This one-time page creates the first admin account. It disables
            itself permanently once used.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
              Password (min 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-gold"
            />
          </div>

          {error && <p className="text-sm text-crimson">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full border border-gold bg-gold py-3 font-mono text-[11px] uppercase tracking-eyebrow text-void transition-colors hover:bg-transparent hover:text-gold disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Admin Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
