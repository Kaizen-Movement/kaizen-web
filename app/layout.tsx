import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono, Anton } from "next/font/google";
import { Suspense } from "react";
import { CartProvider } from "@/lib/cart-context";
import { VisitorHeartbeat } from "@/components/VisitorHeartbeat";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const anton = Anton({
  subsets: ["latin"],
  variable: "--font-anton",
  weight: "400",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kaizensubliminals.store"),
  title: {
    default: "Kaizen — Subliminal Audio & Software for a Deliberate Mind",
    template: "%s — Kaizen",
  },
  description:
    "Precision-engineered subliminal audio and software, built for people who take self-improvement seriously.",
  openGraph: {
    title: "Kaizen",
    description:
      "Precision-engineered subliminal audio and software, built for people who take self-improvement seriously.",
    url: "https://kaizensubliminals.store",
    siteName: "Kaizen",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaizen",
    description:
      "Precision-engineered subliminal audio and software, built for people who take self-improvement seriously.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${anton.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <VisitorHeartbeat />
        <Suspense fallback={null}><AnalyticsTracker /></Suspense>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
