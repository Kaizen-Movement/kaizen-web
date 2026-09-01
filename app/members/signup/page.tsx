"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { memberSignupAction, type MemberAuthState } from "@/lib/actions/member-auth";
import { SealMark } from "@/components/SealMark";

const initialState: MemberAuthState = {};

export default function MemberSignupPage() {
  const [state, formAction] = useFormState(memberSignupAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <SealMark className="h-10 w-10 text-gold" />
          <p className="mt-4 font-display text-2xl text-bone">Create Account</p>
          <p className="mt-1 text-sm text-bone/40">Join Kaizen and access your library</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
              Display Name
            </label>
            <input
              type="text"
              name="display_name"
              className="w-full border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-bone placeholder:text-bone/20 focus:border-gold focus:outline-none"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-bone placeholder:text-bone/20 focus:border-gold focus:outline-none"
              placeholder="you@example.com"
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
              minLength={6}
              className="w-full border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-bone placeholder:text-bone/20 focus:border-gold focus:outline-none"
              placeholder="Min. 6 characters"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <button
            type="submit"
            className="w-full border border-gold bg-gold py-3 font-mono text-[11px] uppercase tracking-eyebrow text-void transition-colors hover:bg-transparent hover:text-gold"
          >
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-bone/40">
          Already have an account?{" "}
          <Link href="/members/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link href="/" className="text-sm text-bone/30 hover:text-bone/50">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}
