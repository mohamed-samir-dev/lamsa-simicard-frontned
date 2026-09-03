import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const maintenance = req.cookies.get("maintenance_on")?.value === "1";
  return NextResponse.json({ maintenance });
}
