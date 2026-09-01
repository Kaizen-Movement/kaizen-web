"use client";

import { useEffect, useState } from "react";

interface TopPath {
  path: string;
  count: number;
}

const POLL_INTERVAL_MS = 15_000;

export function LiveVisitorsCard() {
  const [count, setCount] = useState<number | null>(null);
  const [topPaths, setTopPaths] = useState<TopPath[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchLive = async () => {
      try {
        const res = await fetch("/api/admin/live-visitors");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setCount(data.count);
          setTopPaths(data.topPaths ?? []);
        }
      } catch {
        // Leave the last known value on screen rather than showing an error.
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="border border-white/10 bg-charcoal p-6">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
        </span>
        <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
          Live Visitors Now
        </p>
      </div>
      <p className="mt-2 font-display text-3xl text-gold">{count ?? "—"}</p>
      {topPaths.length > 0 && (
        <ul className="mt-3 space-y-1">
          {topPaths.map((p) => (
            <li key={p.path} className="font-mono text-[10px] text-bone/40">
              {p.path} · {p.count}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
