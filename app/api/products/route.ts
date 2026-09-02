import { NextRequest, NextResponse } from "next/server";
import { getBackend, forwardCookies } from "../admin/_lib";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const res = await fetch(`${getBackend()}/api/products?q=${encodeURIComponent(q)}`, forwardCookies(req, { method: "GET" }));
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
