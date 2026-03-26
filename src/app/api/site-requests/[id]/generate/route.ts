// src/app/api/site-requests/[id]/generate/route.ts

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { runFullPipeline } from "@/services/generation-pipeline.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify ownership
    const siteRequest = await prisma.siteRequest.findUnique({
      where: { id: params.id },
    });

    if (!siteRequest) {
      return NextResponse.json({ error: "Site request not found" }, { status: 404 });
    }

    if (siteRequest.userId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Prevent re-generation
    if (!["DRAFT", "FAILED"].includes(siteRequest.status)) {
      return NextResponse.json(
        { error: "Site has already been generated or is in progress", status: siteRequest.status },
        { status: 409 }
      );
    }

    // Parse image data from request body
    let logoFile = undefined;
    let imageFiles = undefined;
    try {
      const body = await req.json();
      logoFile = body.logoFile;
      imageFiles = body.imageFiles;
    } catch {
      // No body or invalid JSON — that's fine, just no images
    }

    // Mark as queued
    await prisma.siteRequest.update({
      where: { id: params.id },
      data: { status: "QUEUED" },
    });

    // Fire and forget — runs generate + deploy in one shot
    runFullPipeline(params.id, { logoFile, imageFiles }).catch((error) => {
      logger.error("Background pipeline failed", {
        requestId: params.id,
        error: error instanceof Error ? error.message : "Unknown",
      });
    });

    return NextResponse.json({
      id: params.id,
      status: "QUEUED",
      message: "Generation started. Poll /status for updates.",
    });
  } catch (error) {
    logger.error("Failed to start generation", {
      requestId: params.id,
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
