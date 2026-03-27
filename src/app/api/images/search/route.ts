// src/app/api/images/search/route.ts

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    if (!query) {
      return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
    }

    const perPage = 20;
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("Unsplash API error:", res.status, body);
      return NextResponse.json({ error: "Image search failed" }, { status: 502 });
    }

    const data = await res.json();

    const images = data.results.map((img: any) => ({
      id: img.id,
      url: img.urls.regular,
      thumb: img.urls.small,
      alt: img.alt_description || img.description || query,
      credit: img.user.name,
      creditLink: img.user.links.html,
    }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Image search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
