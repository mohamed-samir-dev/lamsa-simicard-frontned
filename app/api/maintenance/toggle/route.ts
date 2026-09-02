import { NextRequest, NextResponse } from "next/server";
import { getBackend, forwardCookies } from "../../admin/_lib";

const BYPASS_TOKEN = process.env.MAINTENANCE_BYPASS_TOKEN || "sahlnaha_bypass_2025";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const r = await fetch(
    `${getBackend()}/api/admin/maintenance`,
    forwardCookies(req, {
      method: "POST",
      body: JSON.stringify({ enabled: body.enabled }),
      headers: { "Content-Type": "application/json" },
    })
  );
  const data = await r.json();
  if (!r.ok) return NextResponse.json(data, { status: r.status });

  const cookieOpts = { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "strict" } as const;
  const res = NextResponse.json(data);

  if (body.enabled) {
    res.cookies.set("maintenance_on", "1", cookieOpts);
  } else {
    res.cookies.set("maintenance_on", "", { ...cookieOpts, maxAge: 0 });
  }
  return res;
}
