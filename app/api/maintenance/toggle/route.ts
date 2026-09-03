import { NextRequest, NextResponse } from "next/server";
import { getBackend, forwardCookies } from "../../admin/_lib";

const COOKIE_OPTS = {
  httpOnly: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  sameSite: "strict",
} as const;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const enabled: boolean = !!body.enabled;

  // حدّث الباكند (اختياري — للحفظ في DB)
  try {
    await fetch(
      `${getBackend()}/api/admin/maintenance`,
      forwardCookies(req, {
        method: "POST",
        body: JSON.stringify({ enabled }),
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch {
    // لو الباكند مش شغال، نكمل بالـ cookie بس
  }

  const res = NextResponse.json({ success: true, maintenance: enabled });

  if (enabled) {
    res.cookies.set("maintenance_on", "1", COOKIE_OPTS);
  } else {
    res.cookies.set("maintenance_on", "", { ...COOKIE_OPTS, maxAge: 0 });
  }

  return res;
}
