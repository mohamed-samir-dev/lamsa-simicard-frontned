import { NextRequest, NextResponse } from "next/server";
import { getBackend, forwardCookies } from "../admin/_lib";

const BYPASS_TOKEN = process.env.MAINTENANCE_BYPASS_TOKEN || "sahlnaha_bypass_2025";

export async function GET(req: NextRequest) {
  const r = await fetch(`${getBackend()}/api/admin/maintenance`, forwardCookies(req, {}));
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const r = await fetch(
    `${getBackend()}/api/admin/maintenance`,
    forwardCookies(req, { method: "POST", body: JSON.stringify({ enabled: body.enabled }), headers: { "Content-Type": "application/json" } })
  );
  const data = await r.json();
  if (!r.ok) return NextResponse.json(data, { status: r.status });

  const res = NextResponse.json(data);
  const cookieOpts = { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "strict" } as const;

  if (body.enabled) {
    res.cookies.set("maintenance_on", "1", cookieOpts);
    res.cookies.set("maintenance_bypass", BYPASS_TOKEN, cookieOpts);
  } else {
    res.cookies.set("maintenance_on", "", { ...cookieOpts, maxAge: 0 });
    res.cookies.set("maintenance_bypass", BYPASS_TOKEN, cookieOpts);
  }
  return res;
}

export async function PUT(req: NextRequest) {
  const r = await fetch(`${getBackend()}/api/admin/maintenance`, forwardCookies(req, {}));
  if (!r.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = NextResponse.json({ success: true });
  res.cookies.set("maintenance_bypass", BYPASS_TOKEN, {
    httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "strict",
  });
  return res;
}
