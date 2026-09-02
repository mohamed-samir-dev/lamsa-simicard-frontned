import { NextRequest, NextResponse } from "next/server";
import { getBackend } from "../../../_lib";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orderRes, companyRes] = await Promise.all([
    fetch(`${getBackend()}/api/checkout/${id}`),
    fetch(`${getBackend()}/api/admin/company`),
  ]);
  const order = await orderRes.json();
  const company = await companyRes.json();
  return NextResponse.json({ order, company });
}
