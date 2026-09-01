import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Lightweight geo lookup from Vercel headers (free, no API needed)
function getGeoFromHeaders(req: NextRequest) {
  return {
    country: req.headers.get("x-vercel-ip-country") || null,
    city: req.headers.get("x-vercel-ip-city") || null,
  };
}

function parseUserAgent(ua: string | null) {
  if (!ua) return { browser: null, os: null, device_type: "desktop" };

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  const device_type = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let browser = "Other";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua)) browser = "Safari";

  let os = "Other";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return { browser, os, device_type };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, path, referrer, screen_width, utm_source, utm_medium, utm_campaign } = body;

    if (!session_id || !path) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const geo = getGeoFromHeaders(req);
    const ua = req.headers.get("user-agent");
    const parsed = parseUserAgent(ua);

    const supabase = createAdminClient();
    await supabase.from("page_views").insert({
      session_id,
      path,
      referrer: referrer || null,
      country: geo.country,
      city: geo.city,
      device_type: parsed.device_type,
      browser: parsed.browser,
      os: parsed.os,
      screen_width: screen_width || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // fail silently for tracking
  }
}
