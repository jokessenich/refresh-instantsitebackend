// src/app/api/site-requests/[id]/deploy/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { runDeploymentPipeline } from "@/services/generation-pipeline.service";

export async function POST(
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
      include: { generatedSite: true, deployment: true },
    });

    if (!siteRequest) {
      return NextResponse.json({ error: "Site request not found" }, { status: 404 });
    }

    if (siteRequest.userId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (!siteRequest.generatedSite) {
      return NextResponse.json(
        { error: "Site must be generated before deployment" },
        { status: 400 }
      );
    }

    if (siteRequest.deployment) {
      return NextResponse.json(
        {
          error: "Site has already been deployed",
          previewUrl: siteRequest.deployment.previewUrl,
        },
        { status: 409 }
      );
    }

    if (siteRequest.status === "DEPLOYING") {
      return NextResponse.json(
        { error: "Deployment already in progress" },
        { status: 409 }
      );
    }

    // Fire and forget — client polls /status
    runDeploymentPipeline(params.id).catch((error) => {
      logger.error("Background deployment failed", {
        requestId: params.id,
        error: error instanceof Error ? error.message : "Unknown",
      });
    });

    return NextResponse.json({
      id: params.id,
      status: "DEPLOYING",
      message: "Deployment started. Poll /status for updates.",
    });
  } catch (error) {
    logger.error("Failed to start deployment", {
      requestId: params.id,
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
