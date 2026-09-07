import { NextRequest, NextResponse } from "next/server";
import { getBackend, forwardCookies } from "../../../../_lib";

export async function POST(req: NextRequest, { params }: { params: Promise<{ index: string }> }) {
  const { index } = await params;
  const body = await req.formData();
  const res = await fetch(`${getBackend()}/api/admin/company/footer-items/image/${index}`, forwardCookies(req, { method: "POST", body }));
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
