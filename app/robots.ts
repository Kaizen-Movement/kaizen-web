import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/checkout",
        "/cart",
        "/download/",
        "/setup",
      ],
    },
    sitemap: "https://kaizensubliminals.store/sitemap.xml",
  };
}
