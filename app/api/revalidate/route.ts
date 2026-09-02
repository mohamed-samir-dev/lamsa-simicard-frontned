import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const tag = req.nextUrl.searchParams.get("tag");
  if (tag) revalidateTag(tag);
  return NextResponse.json({ revalidated: true });
}
