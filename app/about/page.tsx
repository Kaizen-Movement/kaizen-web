import type { Metadata } from "next";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: "https://kaizensubliminals.store/about" },
};

export default function AboutPage() {
  return (
    <InfoPageLayout eyebrow="Our Story" title="About Kaizen">
      <p>
        Kaizen means "continuous improvement" — small, deliberate changes
        compounding into real transformation. That's the principle behind
        every piece of audio we produce: precision-engineered subliminal
        tracks and software built for people who take self-improvement
        seriously.
      </p>
      <p>
        We're not interested in vague affirmations or one-size-fits-all
        content. Every release is built with intent, covering everything
        from mindset and discipline to attraction and lifestyle — designed
        to fit into a daily routine, not disrupt it.
      </p>
      <h2>What We Make</h2>
      <p>
        Digital audio and software, delivered instantly after purchase.
        No physical products, no shipping — just a direct download the
        moment your order is confirmed.
      </p>
      <h2>Questions?</h2>
      <p>
        Check our <a href="/faq">FAQ</a> or{" "}
        <a href="/contact">get in touch</a> directly.
      </p>
    </InfoPageLayout>
  );
}
