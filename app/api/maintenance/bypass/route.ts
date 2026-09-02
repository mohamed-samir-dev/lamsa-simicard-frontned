import { NextRequest, NextResponse } from "next/server";
import { getBackend, forwardCookies } from "../../admin/_lib";

const BYPASS_TOKEN = process.env.MAINTENANCE_BYPASS_TOKEN || "sahlnaha_bypass_2025";

export async function POST(req: NextRequest) {
  // Verify admin session first
  const r = await fetch(`${getBackend()}/api/admin/maintenance`, forwardCookies(req, {}));
  if (!r.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = NextResponse.json({ success: true });
  res.cookies.set("maintenance_bypass", BYPASS_TOKEN, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "strict",
  });
  return res;
}
