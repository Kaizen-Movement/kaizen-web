import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = req.nextUrl.searchParams.get("range") || "7d";

  let daysBack = 7;
  if (range === "24h") daysBack = 1;
  else if (range === "7d") daysBack = 7;
  else if (range === "30d") daysBack = 30;
  else if (range === "90d") daysBack = 90;

  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createClient();

  // Get all page views in range
  const { data: views } = await supabase
    .from("page_views")
    .select("path, country, city, device_type, browser, os, created_at, session_id")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  const allViews = views || [];

  // Calculate stats
  const totalViews = allViews.length;
  const uniqueSessions = new Set(allViews.map((v) => v.session_id)).size;

  // Views by day
  const byDay: Record<string, number> = {};
  const sessionsByDay: Record<string, Set<string>> = {};
  for (const v of allViews) {
    const day = v.created_at.split("T")[0];
    byDay[day] = (byDay[day] || 0) + 1;
    if (!sessionsByDay[day]) sessionsByDay[day] = new Set();
    sessionsByDay[day].add(v.session_id);
  }

  const dailyViews = Object.entries(byDay)
    .map(([date, views]) => ({
      date,
      views,
      visitors: sessionsByDay[date]?.size || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Views by hour (0-23)
  const byHour: Record<number, number> = {};
  for (let i = 0; i < 24; i++) byHour[i] = 0;
  for (const v of allViews) {
    const hour = new Date(v.created_at).getHours();
    byHour[hour]++;
  }
  const hourlyViews = Object.entries(byHour).map(([hour, count]) => ({
    hour: parseInt(hour),
    count,
  }));

  // Top countries
  const byCountry: Record<string, number> = {};
  for (const v of allViews) {
    const c = v.country || "Unknown";
    byCountry[c] = (byCountry[c] || 0) + 1;
  }
  const topCountries = Object.entries(byCountry)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Top pages
  const byPage: Record<string, number> = {};
  for (const v of allViews) {
    byPage[v.path] = (byPage[v.path] || 0) + 1;
  }
  const topPages = Object.entries(byPage)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Device breakdown
  const byDevice: Record<string, number> = {};
  for (const v of allViews) {
    const d = v.device_type || "desktop";
    byDevice[d] = (byDevice[d] || 0) + 1;
  }
  const devices = Object.entries(byDevice).map(([type, count]) => ({ type, count }));

  // Browser breakdown
  const byBrowser: Record<string, number> = {};
  for (const v of allViews) {
    const b = v.browser || "Unknown";
    byBrowser[b] = (byBrowser[b] || 0) + 1;
  }
  const browsers = Object.entries(byBrowser)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    totalViews,
    uniqueSessions,
    dailyViews,
    hourlyViews,
    topCountries,
    topPages,
    devices,
    browsers,
  });
}
