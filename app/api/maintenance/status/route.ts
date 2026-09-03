import { NextRequest, NextResponse } from "next/server";
import { getBackend, forwardCookies } from "../../admin/_lib";

export async function GET(req: NextRequest) {
  const r = await fetch(`${getBackend()}/api/admin/maintenance`, forwardCookies(req, {}));
  if (!r.ok) return NextResponse.json({ maintenance: false }, { status: r.status });
  const data = await r.json();
  return NextResponse.json(data);
}
