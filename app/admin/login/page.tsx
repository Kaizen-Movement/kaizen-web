"use client";

import { useFormState } from "react-dom";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { SealMark } from "@/components/SealMark";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <SealMark className="h-10 w-10 text-gold" />
          <p className="mt-4 font-display text-2xl text-bone">Kaizen Admin</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-gold"
            />
          </div>

          {state.error && (
            <p className="text-sm text-crimson">{state.error}</p>
          )}

          <button
            type="submit"
            className="w-full border border-gold bg-gold py-3 font-mono text-[11px] uppercase tracking-eyebrow text-void transition-colors hover:bg-transparent hover:text-gold"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
