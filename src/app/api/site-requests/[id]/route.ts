// src/app/api/site-requests/[id]/route.ts

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const siteRequest = await prisma.siteRequest.findUnique({
      where: { id: params.id },
      include: {
        generatedSite: {
          select: {
            id: true,
            templateId: true,
            assembledAt: true,
            createdAt: true,
          },
        },
        deployment: {
          select: {
            id: true,
            previewUrl: true,
            deploymentUrl: true,
            status: true,
            deployedAt: true,
          },
        },
        uploadedAssets: {
          select: {
            id: true,
            fileName: true,
            assetType: true,
            publicUrl: true,
          },
        },
      },
    });

    if (!siteRequest) {
      return NextResponse.json({ error: "Site request not found" }, { status: 404 });
    }

    if (siteRequest.userId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    return NextResponse.json(siteRequest);
  } catch (error) {
    logger.error("Failed to fetch site request", {
      requestId: params.id,
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
