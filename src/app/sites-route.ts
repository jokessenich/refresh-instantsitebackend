// src/app/sites/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const generatedSite = await prisma.generatedSite.findFirst({
      where: { siteRequestId: params.id },
      select: { generatedContent: true },
    });

    if (!generatedSite) {
      return new NextResponse("Site not found", { status: 404 });
    }

    const content = generatedSite.generatedContent as { html?: string };
    const html = content?.html;

    if (!html) {
      return new NextResponse("Site content not available", { status: 404 });
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to serve site:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
