import type { Metadata } from "next";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "https://kaizensubliminals.store/privacy" },
};

export default function PrivacyPage() {
  return (
    <InfoPageLayout eyebrow="Legal" title="Privacy Policy">
      <p>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}</p>

      <p>
        This policy explains what information we collect when you use
        Kaizen, and how it's used.
      </p>

      <h2>What We Collect</h2>
      <p>
        When you make a purchase, we collect your email address and order
        details (items purchased, amount paid) so we can deliver your
        files and provide support. Payment itself is handled entirely by
        PayPal — we never see or store your card or bank information.
      </p>
      <p>
        Your shopping cart is stored locally in your browser only (not on
        our servers) until you check out.
      </p>

      <h2>How We Use It</h2>
      <p>
        We use your order information to fulfill your purchase, send you
        download links and order confirmations, and respond if you contact
        us for support. We don't sell or rent your information to third
        parties.
      </p>

      <h2>Third-Party Services</h2>
      <p>We rely on the following providers to run the site:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>PayPal</strong> — payment processing
        </li>
        <li>
          <strong>Resend</strong> — sending order confirmation and
          download-link emails
        </li>
        <li>
          <strong>Supabase</strong> — secure database hosting for order
          records
        </li>
        <li>
          <strong>Cloudflare</strong> — secure file storage for the
          products you purchase
        </li>
        <li>
          <strong>Vercel</strong> — website hosting and cookieless,
          aggregate visitor analytics
        </li>
      </ul>
      <p>
        Each of these providers processes data under their own privacy
        policies, only to the extent needed to provide their part of the
        service.
      </p>

      <h2>Data Retention</h2>
      <p>
        We retain order records for as long as needed to provide support,
        handle any disputes, and meet standard accounting/legal
        obligations.
      </p>

      <h2>Your Rights</h2>
      <p>
        You can request a copy of the information we hold about your order,
        or ask us to delete it, by <a href="/contact">contacting us</a>.
      </p>

      <h2>Cookies</h2>
      <p>
        See our <a href="/cookies">Cookie Policy</a> for details on what
        we do (and don't) use cookies for.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this policy occasionally. Material changes will be
        reflected by an updated date at the top of this page.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about your data? <a href="/contact">Get in touch</a>.
      </p>
    </InfoPageLayout>
  );
}
