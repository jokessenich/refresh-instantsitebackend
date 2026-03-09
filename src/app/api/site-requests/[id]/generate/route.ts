// src/app/api/site-requests/[id]/generate/route.ts

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { runGenerationPipeline } from "@/services/generation-pipeline.service";

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

    // Mark as queued immediately and return
    await prisma.siteRequest.update({
      where: { id: params.id },
      data: { status: "QUEUED" },
    });

    // Fire and forget — in production use a job queue (BullMQ, Inngest, etc.)
    // For V1, we run it async and the client polls /status
    runGenerationPipeline(params.id).catch((error) => {
      logger.error("Background generation failed", {
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
