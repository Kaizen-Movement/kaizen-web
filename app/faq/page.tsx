import type { Metadata } from "next";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "FAQ",
  alternates: { canonical: "https://kaizensubliminals.store/faq" },
};

const FAQS = [
  {
    q: "How do I get my files after I purchase?",
    a: "Everything is delivered digitally. As soon as your payment is confirmed, you'll get an email with direct download links for each item in your order — no account or login required.",
  },
  {
    q: "Is there a physical product?",
    a: "No — every product on Kaizen is a digital audio or software file. Nothing ships.",
  },
  {
    q: "My download link isn't working — what do I do?",
    a: "Download links expire after a set time and a limited number of uses, mainly to keep files from being shared publicly. If yours has stopped working, reply to your confirmation email or use the Contact page and we'll issue a fresh one.",
  },
  {
    q: "Do you offer refunds?",
    a: "Because every product is delivered instantly as a digital file, we generally don't offer refunds once a download link has been issued. If something's genuinely wrong with your order, reach out — we'll look at it case by case.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Checkout is handled through PayPal, which also supports most major debit and credit cards without requiring a PayPal account.",
  },
  {
    q: "Is my payment information safe?",
    a: "Yes — payment details are handled entirely by PayPal. We never see or store your card or bank information.",
  },
];

export default function FaqPage() {
  return (
    <InfoPageLayout eyebrow="Support" title="Frequently Asked Questions">
      {FAQS.map((item) => (
        <div key={item.q}>
          <h2>{item.q}</h2>
          <p>{item.a}</p>
        </div>
      ))}
      <p>
        Didn't find what you're looking for?{" "}
        <a href="/contact">Contact us</a> directly.
      </p>
    </InfoPageLayout>
  );
}
