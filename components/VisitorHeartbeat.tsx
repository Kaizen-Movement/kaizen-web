"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const HEARTBEAT_INTERVAL_MS = 20_000;
const SESSION_KEY = "kaizen_visitor_session";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // sessionStorage unavailable (privacy mode etc.) — fall back to an
    // in-memory id for the lifetime of this page load.
    return crypto.randomUUID();
  }
}

export function VisitorHeartbeat() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const sessionId = getSessionId();

    const ping = () => {
      fetch("/api/visitor-heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, path: pathname }),
        keepalive: true,
      }).catch(() => {
        // Silently ignore — this is a nice-to-have admin stat, never
        // something a visitor's experience should depend on.
      });
    };

    ping();
    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
