"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  totalViews: number;
  uniqueSessions: number;
  dailyViews: { date: string; views: number; visitors: number }[];
  hourlyViews: { hour: number; count: number }[];
  topCountries: { country: string; count: number }[];
  topPages: { path: string; count: number }[];
  devices: { type: string; count: number }[];
  browsers: { name: string; count: number }[];
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", ZA: "South Africa", CA: "Canada",
  AU: "Australia", DE: "Germany", FR: "France", NG: "Nigeria", IN: "India",
  BR: "Brazil", JP: "Japan", KE: "Kenya", GH: "Ghana", NL: "Netherlands",
  SE: "Sweden", Unknown: "Unknown",
};

function BarChart({ data, maxVal }: { data: { label: string; value: number }[]; maxVal: number }) {
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-20 shrink-0 truncate font-mono text-[11px] text-bone/50">{d.label}</span>
          <div className="flex-1">
            <div
              className="h-5 rounded-sm bg-gradient-to-r from-crimson/60 to-crimson/30"
              style={{ width: `${Math.max(2, (d.value / maxVal) * 100)}%` }}
            />
          </div>
          <span className="w-10 text-right font-mono text-[11px] text-bone/70">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function MiniLineChart({ data }: { data: { date: string; views: number; visitors: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-bone/30">No data yet</p>;

  const maxViews = Math.max(...data.map((d) => d.views), 1);
  const chartH = 160;
  const chartW = 600;
  const stepX = chartW / Math.max(data.length - 1, 1);

  const viewsPoints = data.map((d, i) => `${i * stepX},${chartH - (d.views / maxViews) * chartH}`).join(" ");
  const visitorsPoints = data.map((d, i) => `${i * stepX},${chartH - (d.visitors / maxViews) * chartH}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${chartW} ${chartH + 30}`} className="w-full min-w-[400px]" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={0} y1={chartH - pct * chartH} x2={chartW} y2={chartH - pct * chartH}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1"
          />
        ))}
        {/* Views line */}
        <polyline points={viewsPoints} fill="none" stroke="#3AA9D6" strokeWidth="2" />
        {/* Visitors line */}
        <polyline points={visitorsPoints} fill="none" stroke="#AEDCEA" strokeWidth="2" strokeDasharray="4 3" />
        {/* Date labels */}
        {data.map((d, i) => {
          if (data.length > 14 && i % Math.ceil(data.length / 7) !== 0) return null;
          return (
            <text
              key={d.date}
              x={i * stepX}
              y={chartH + 18}
              fill="rgba(234,243,247,0.3)"
              fontSize="10"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {d.date.slice(5)}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 flex gap-6 font-mono text-[10px] text-bone/40">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-crimson" /> Page Views
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 border-t border-dashed border-gold" /> Unique Visitors
        </span>
      </div>
    </div>
  );
}

function HourlyHeatmap({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex gap-1">
      {data.map((d) => {
        const intensity = d.count / max;
        return (
          <div key={d.hour} className="flex flex-col items-center gap-1">
            <div
              className="h-10 w-5 rounded-sm"
              style={{
                backgroundColor: `rgba(58, 169, 214, ${Math.max(0.05, intensity)})`,
              }}
              title={`${d.hour}:00 — ${d.count} views`}
            />
            <span className="font-mono text-[8px] text-bone/30">
              {d.hour % 6 === 0 ? `${d.hour}` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range]);

  const ranges = [
    { value: "24h", label: "24h" },
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "90d", label: "90 days" },
  ];

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow mb-2">Intelligence</p>
          <h1 className="font-display text-3xl text-bone">Analytics</h1>
        </div>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-eyebrow transition-colors ${
                range === r.value
                  ? "bg-crimson text-void"
                  : "border border-white/10 text-bone/50 hover:text-gold"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-12 text-center text-bone/30">Loading analytics...</div>
      ) : !data ? (
        <div className="mt-12 text-center text-bone/30">Failed to load</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
            <div className="border border-white/10 bg-charcoal p-6">
              <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Total Views</p>
              <p className="mt-2 font-display text-3xl text-gold">{data.totalViews.toLocaleString()}</p>
            </div>
            <div className="border border-white/10 bg-charcoal p-6">
              <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Unique Visitors</p>
              <p className="mt-2 font-display text-3xl text-gold">{data.uniqueSessions.toLocaleString()}</p>
            </div>
            <div className="border border-white/10 bg-charcoal p-6">
              <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Countries</p>
              <p className="mt-2 font-display text-3xl text-gold">{data.topCountries.length}</p>
            </div>
            <div className="border border-white/10 bg-charcoal p-6">
              <p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">Pages Visited</p>
              <p className="mt-2 font-display text-3xl text-gold">{data.topPages.length}</p>
            </div>
          </div>

          {/* Traffic chart */}
          <div className="mt-8 border border-white/10 bg-charcoal p-6">
            <p className="mb-6 font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
              Traffic Over Time
            </p>
            <MiniLineChart data={data.dailyViews} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Hourly heatmap */}
            <div className="border border-white/10 bg-charcoal p-6">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
                Traffic by Hour (UTC)
              </p>
              <HourlyHeatmap data={data.hourlyViews} />
            </div>

            {/* Device breakdown */}
            <div className="border border-white/10 bg-charcoal p-6">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
                Devices
              </p>
              <div className="flex gap-6">
                {data.devices.map((d) => {
                  const pct = data.totalViews ? Math.round((d.count / data.totalViews) * 100) : 0;
                  return (
                    <div key={d.type} className="text-center">
                      <p className="font-display text-2xl text-gold">{pct}%</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">
                        {d.type}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top countries */}
            <div className="border border-white/10 bg-charcoal p-6">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
                Top Countries
              </p>
              <BarChart
                data={data.topCountries.map((c) => ({
                  label: COUNTRY_NAMES[c.country] || c.country,
                  value: c.count,
                }))}
                maxVal={data.topCountries[0]?.count || 1}
              />
            </div>

            {/* Top pages */}
            <div className="border border-white/10 bg-charcoal p-6">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
                Top Pages
              </p>
              <BarChart
                data={data.topPages.map((p) => ({
                  label: p.path === "/" ? "Homepage" : p.path,
                  value: p.count,
                }))}
                maxVal={data.topPages[0]?.count || 1}
              />
            </div>

            {/* Browsers */}
            <div className="border border-white/10 bg-charcoal p-6 lg:col-span-2">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-eyebrow text-bone/50">
                Browsers
              </p>
              <div className="flex flex-wrap gap-6">
                {data.browsers.map((b) => {
                  const pct = data.totalViews ? Math.round((b.count / data.totalViews) * 100) : 0;
                  return (
                    <div key={b.name} className="text-center">
                      <p className="font-display text-xl text-gold">{pct}%</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">
                        {b.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
