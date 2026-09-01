import type { Metadata } from "next";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  alternates: { canonical: "https://kaizensubliminals.store/cookies" },
};

export default function CookiesPage() {
  return (
    <InfoPageLayout eyebrow="Legal" title="Cookie Policy">
      <p>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}</p>

      <p>
        We keep this simple: Kaizen does not use advertising or tracking
        cookies.
      </p>

      <h2>Your Shopping Cart</h2>
      <p>
        Your cart is stored using your browser's local storage, not a
        cookie. It stays on your device and is never sent to our servers
        until you check out.
      </p>

      <h2>Site Analytics</h2>
      <p>
        We use Vercel's cookieless analytics to understand overall traffic
        to the site (things like page views), which doesn't identify you
        individually and doesn't use cookies.
      </p>

      <h2>Admin Login</h2>
      <p>
        If you're logging into an administrator account, a secure session
        cookie is used to keep you signed in. This only applies to store
        staff, not regular visitors or customers.
      </p>

      <h2>Questions</h2>
      <p>
        Get in touch on our <a href="/contact">Contact page</a> if you'd
        like more detail.
      </p>
    </InfoPageLayout>
  );
}
