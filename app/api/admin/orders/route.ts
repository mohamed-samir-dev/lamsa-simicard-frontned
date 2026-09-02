import { NextResponse } from "next/server";
import { getBackend } from "../_lib";

export async function GET() {
  const res = await fetch(`${getBackend()}/api/checkout`);
  const data = await res.json();
  return NextResponse.json(data);
}
