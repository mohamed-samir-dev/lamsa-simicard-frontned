import { NextRequest, NextResponse } from "next/server";
import { getBackend, forwardCookies } from "../../admin/_lib";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const enabled: boolean = !!body.enabled;

  const r = await fetch(
    `${getBackend()}/api/admin/maintenance`,
    forwardCookies(req, {
      method: "POST",
      body: JSON.stringify({ enabled }),
      headers: { "Content-Type": "application/json" },
    })
  );
  const data = await r.json();
  if (!r.ok) return NextResponse.json(data, { status: r.status });
  return NextResponse.json({ success: true, maintenance: enabled });
}
