import { NextRequest, NextResponse } from "next/server";

// Use server-side key (no NEXT_PUBLIC_ prefix) for API routes
const KEY = process.env.GOOGLE_MAPS_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

export async function GET(req: NextRequest) {
  if (!KEY) return NextResponse.json({ error: "API key missing" }, { status: 500 });

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");

  let url = "";
  if (type === "autocomplete") {
    const input = searchParams.get("input") ?? "";
    url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&language=ar&components=country:sa&key=${KEY}`;
  } else if (type === "details") {
    const place_id = searchParams.get("place_id") ?? "";
    url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=geometry,formatted_address,address_components,plus_code&language=ar&key=${KEY}`;
  } else {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "upstream error" }, { status: 502 });
  }
}
