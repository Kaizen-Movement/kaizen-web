import type { Metadata } from "next";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "Contact",
  alternates: { canonical: "https://kaizensubliminals.store/contact" },
};

export default function ContactPage() {
  return (
    <InfoPageLayout eyebrow="Get In Touch" title="Contact">
      <p>
        Questions about an order, a download link, or anything else —
        reach out and we'll get back to you as soon as we can.
      </p>
      <h2>Email</h2>
      <p>
        <a href="mailto:kaizenrequest01@gmail.com">
          kaizenrequest01@gmail.com
        </a>
      </p>
      <p>
        If you're writing about an existing order, replying directly to
        your order confirmation email is the fastest way to get help —
        it keeps your order details attached automatically.
      </p>
    </InfoPageLayout>
  );
}
