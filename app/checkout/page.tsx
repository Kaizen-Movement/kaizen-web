"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SealMark } from "@/components/SealMark";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/types";

declare global {
  interface Window {
    paypal?: any;
  }
}

interface DownloadResult {
  productTitle: string;
  downloadPath: string | null;
  note?: string;
}

export default function CheckoutPage() {
  const { lines, totalCents } = useCart();
  const [email, setEmail] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloads, setDownloads] = useState<DownloadResult[] | null>(null);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRendered = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!sdkReady || !emailConfirmed || buttonsRendered.current) return;
    if (!window.paypal || !buttonsContainerRef.current) return;

    buttonsRendered.current = true;

    window.paypal
      .Buttons({
        style: { color: "gold", shape: "rect", label: "pay" },
        createOrder: async () => {
          setError(null);
          const res = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              items: lines.map((l) => ({
                productId: l.productId,
                quantity: l.quantity,
              })),
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error ?? "Could not start checkout.");
            throw new Error(data.error);
          }
          return data.paypalOrderId;
        },
        onApprove: async (data: { orderID: string }) => {
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paypalOrderId: data.orderID }),
          });
          const result = await res.json();
          if (!res.ok) {
            setError(result.error ?? "Payment could not be completed.");
            return;
          }
          setDownloads(result.downloads);
          window.localStorage.removeItem("kaizen_cart_v1");
        },
        onError: () => {
          setError("Something went wrong with PayPal. Please try again.");
        },
      })
      .render(buttonsContainerRef.current);
  }, [sdkReady, emailConfirmed, email, lines]);

  if (downloads) {
    return (
      <>
        <Header />
        <main className="min-h-[70vh] pt-24">
          <div className="mx-auto max-w-xl px-6 py-16 text-center">
            <SealMark className="mx-auto h-12 w-12 text-gold" />
            <h1 className="mt-6 font-display text-3xl text-bone">
              Thank You
            </h1>
            <p className="mt-2 text-sm text-bone/50">
              Your order is confirmed. Here are your downloads:
            </p>

            <div className="mt-10 divide-y divide-white/10 border-y border-white/10 text-left">
              {downloads.map((d, i) => (
                <div key={i} className="py-4">
                  <p className="text-bone">{d.productTitle}</p>
                  {d.downloadPath ? (
                    <Link
                      href={d.downloadPath}
                      className="mt-1 inline-block font-mono text-xs uppercase tracking-eyebrow text-gold underline underline-offset-4"
                    >
                      Download →
                    </Link>
                  ) : (
                    <p className="mt-1 text-xs text-bone/40">{d.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (lines.length === 0) {
    return (
      <>
        <Header />
        <main className="flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
          <SealMark className="h-14 w-14 text-gold/25" />
          <p className="mt-6 text-bone/50">Your cart is empty.</p>
          <Link
            href="/collections/all"
            className="mt-6 border border-gold px-6 py-3 font-mono text-[11px] uppercase tracking-eyebrow text-gold transition-colors hover:bg-gold hover:text-void"
          >
            Browse Products
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      {clientId && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`}
          onLoad={() => setSdkReady(true)}
        />
      )}
      <Header />
      <main className="min-h-[70vh] pt-24">
        <div className="mx-auto max-w-xl px-6 py-12">
          <p className="eyebrow mb-2">Checkout</p>
          <h1 className="font-display text-3xl text-bone">
            Complete Your Order
          </h1>

          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {lines.map((line) => (
              <div
                key={line.productId}
                className="flex items-center justify-between py-4 text-sm"
              >
                <span className="text-bone">{line.title}</span>
                <span className="font-mono text-gold">
                  {formatPrice(line.priceCents)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="font-mono text-sm uppercase tracking-eyebrow text-bone/60">
              Total
            </span>
            <span className="font-mono text-xl text-gold">
              {formatPrice(totalCents)}
            </span>
          </div>

          {!emailConfirmed ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.includes("@")) setEmailConfirmed(true);
              }}
              className="mt-8"
            >
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
                Email — where we&apos;ll send your downloads
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                className="mt-4 w-full border border-gold bg-gold py-3 font-mono text-[11px] uppercase tracking-eyebrow text-void transition-colors hover:bg-transparent hover:text-gold"
              >
                Continue to Payment
              </button>
            </form>
          ) : (
            <div className="mt-8">
              <p className="mb-4 text-sm text-bone/50">
                Paying as <span className="text-bone">{email}</span> —{" "}
                <button
                  onClick={() => {
                    setEmailConfirmed(false);
                    buttonsRendered.current = false;
                  }}
                  className="text-gold underline underline-offset-2"
                >
                  change
                </button>
              </p>
              {!sdkReady && (
                <p className="text-sm text-bone/40">Loading payment options...</p>
              )}
              <div ref={buttonsContainerRef} />
              {error && <p className="mt-3 text-sm text-crimson">{error}</p>}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
