import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SealMark } from "@/components/SealMark";

export const metadata: Metadata = {
  title: "Custom Request",
  description:
    "Commission a fully personalized subliminal — your topic, your goals, built and delivered by Kaizen.",
};

interface Tier {
  rank: string;
  name: string;
  price: string;
  badge?: string;
  features: string[];
  delivery: string;
  paypalUrl: string;
}

const TIERS: Tier[] = [
  {
    rank: "Knight",
    name: "Foundation Build",
    price: "$15",
    features: [
      "1 fully customized subliminal — your choice of topic",
      "Personalized affirmations written for your exact goal",
      "1 audio format (MP3)",
      "Light subconscious scripting — confidence & receptivity layer",
      "2–4 layered affirmation tracks",
      "Standard audio enhancement",
    ],
    delivery: "Delivered in 48–72 hours",
    paypalUrl: "https://www.paypal.com/ncp/payment/V5DLZHBP4Y64Q",
  },
  {
    rank: "Commander",
    name: "Advanced Build",
    price: "$20",
    badge: "Most Popular",
    features: [
      "Advanced affirmation scripting for deeper subconscious influence",
      "Identity-based affirmations & belief-shifting layer",
      "5–8 layered affirmation tracks",
      "Multiple subconscious reinforcement techniques",
      "Enhanced audio processing (binaural-style panning)",
      "2 audio versions — Day + Sleep",
    ],
    delivery: "Priority delivery — 24–48 hours",
    paypalUrl: "https://www.paypal.com/ncp/payment/G8STKS6Q4AGVN",
  },
  {
    rank: "Kaizen Elite",
    name: "Maximum Imprint Build",
    price: "$35",
    badge: "Elite Access",
    features: [
      "Kaizen Affirmation System — high-density subconscious saturation",
      "Elite identity-level scripting (self-concept + reality shift)",
      "10–20 layered affirmations for maximum subconscious imprint",
      "4 affirmation structures: identity / assumption / command / inevitability",
      "Precision audio engineering for maximum absorption",
      "Optimized pacing & affirmation stacking",
      "3 versions — Day / Sleep / Intensity",
      "Full manifestation blueprint — attraction + self-concept + reality shift",
      "Beta access to the Kaizen App (early testers only)",
    ],
    delivery: "Ultra-priority delivery — 12–24 hours",
    paypalUrl: "https://www.paypal.com/ncp/payment/NY27TJWHCPC9C",
  },
];

export default function CustomRequestPage() {
  return (
    <>
      <Header />
      <main className="pt-24">
        <section className="relative overflow-hidden border-b border-white/10 bg-burgundy-vignette">
          <div className="pointer-events-none absolute -right-[15%] top-1/2 h-[700px] w-[700px] -translate-y-1/2 bg-seal-radial">
            <SealMark animate className="h-full w-full text-burgundy" />
          </div>
          <div className="relative mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
            <p className="eyebrow mb-4">Bespoke</p>
            <h1 className="font-impact text-5xl uppercase leading-[0.95] text-bone md:text-6xl">
              Custom Request
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-bone/60">
              A subliminal built specifically for you — your topic, your
              goals, your exact intention. Choose a tier below and your
              request enters production immediately after checkout.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {TIERS.map((tier) => {
              const isElite = tier.badge === "Elite Access";
              const isPopular = tier.badge === "Most Popular";

              return (
                <div
                  key={tier.rank}
                  className={`relative flex flex-col border p-8 transition-all ${
                    isPopular
                      ? "border-gold bg-charcoal shadow-[0_0_40px_-12px_rgba(174,220,234,0.35)] lg:-translate-y-3"
                      : isElite
                        ? "border-crimson/60 bg-gradient-to-b from-burgundy-deep to-charcoal shadow-[0_0_40px_-12px_rgba(58,169,214,0.5)]"
                        : "border-white/10 bg-charcoal"
                  }`}
                >
                  {tier.badge && (
                    <span
                      className={`absolute -top-3 left-8 border px-3 py-1 font-mono text-[10px] uppercase tracking-eyebrow ${
                        isPopular
                          ? "border-gold bg-gold text-void"
                          : "border-crimson bg-crimson text-bone"
                      }`}
                    >
                      {tier.badge}
                    </span>
                  )}

                  <p className="font-mono text-[11px] uppercase tracking-eyebrow text-gold">
                    ♞ {tier.rank}
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-bone">
                    {tier.name}
                  </h2>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="font-impact text-5xl text-bone">
                      {tier.price}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-eyebrow text-bone/40">
                      One-time
                    </span>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {tier.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex gap-2.5 text-sm leading-snug text-bone/70"
                      >
                        <span className="mt-0.5 shrink-0 text-gold">♞</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-6 font-mono text-[11px] uppercase tracking-eyebrow text-bone/40">
                    {tier.delivery}
                  </p>

                  <a
                    href={tier.paypalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-6 block border py-3 text-center font-mono text-[11px] uppercase tracking-eyebrow transition-colors ${
                      isPopular
                        ? "border-gold bg-gold text-void hover:bg-transparent hover:text-gold"
                        : isElite
                          ? "border-crimson bg-crimson text-bone hover:bg-transparent hover:text-crimson"
                          : "border-gold text-gold hover:bg-gold hover:text-void"
                    }`}
                  >
                    Order via PayPal →
                  </a>
                </div>
              );
            })}
          </div>

          <p className="mt-10 max-w-xl text-xs text-bone/40">
            After checkout on PayPal, reply to your receipt email (or contact
            us directly) with your topic and goal so we can begin production.
            Delivery windows begin once your request details are received.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
