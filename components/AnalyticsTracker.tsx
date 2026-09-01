"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getSessionId() {
  const key = "kaizen_sid";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef("");

  useEffect(() => {
    const fullPath = pathname + (searchParams.toString() ? `?${searchParams}` : "");
    if (fullPath === lastPath.current) return;
    lastPath.current = fullPath;

    try {
      const sid = getSessionId();
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sid,
          path: pathname,
          referrer: document.referrer || null,
          screen_width: window.screen.width,
          utm_source: searchParams.get("utm_source"),
          utm_medium: searchParams.get("utm_medium"),
          utm_campaign: searchParams.get("utm_campaign"),
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Analytics should never break the page
    }
  }, [pathname, searchParams]);

  return null;
}
