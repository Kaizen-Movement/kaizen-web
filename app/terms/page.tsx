import type { Metadata } from "next";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "https://kaizensubliminals.store/terms" },
};

export default function TermsPage() {
  return (
    <InfoPageLayout eyebrow="Legal" title="Terms of Service">
      <p>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or purchasing from Kaizen ("we," "us," "our"), you agree
        to these Terms of Service. If you don't agree, please don't use the
        site.
      </p>

      <h2>2. Digital Products</h2>
      <p>
        Everything we sell is a digital audio or software file delivered
        electronically. Nothing is shipped physically. Access is provided
        via download links sent to the email address you provide at
        checkout.
      </p>

      <h2>3. License</h2>
      <p>
        Purchasing a product grants you a personal, non-exclusive,
        non-transferable license to use that file for your own personal
        use. You may not resell, redistribute, publicly share, or upload
        our files to any other platform or marketplace.
      </p>

      <h2>4. Payment</h2>
      <p>
        Prices are listed in USD. Payment is processed securely through
        PayPal; we do not collect or store your card or bank details
        directly.
      </p>

      <h2>5. Refunds</h2>
      <p>
        Because products are delivered instantly as digital files, we
        generally don't offer refunds once a download link has been
        issued. If you believe there's a genuine problem with your order,
        contact us and we'll review it individually.
      </p>

      <h2>6. Disclaimer</h2>
      <p>
        Our products are intended for personal development and
        entertainment purposes. They are not a substitute for professional
        medical, psychological, or financial advice, and we make no
        guarantee of specific results. Individual outcomes vary and
        depend on many factors outside our control.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, Kaizen is not liable for
        any indirect, incidental, or consequential damages arising from
        the use of our products or this site.
      </p>

      <h2>8. Changes to These Terms</h2>
      <p>
        We may update these terms from time to time. Continued use of the
        site after changes are posted constitutes acceptance of the
        updated terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these terms? <a href="/contact">Get in touch</a>.
      </p>
    </InfoPageLayout>
  );
}
