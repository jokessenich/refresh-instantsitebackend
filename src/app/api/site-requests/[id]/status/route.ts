// src/app/api/site-requests/[id]/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StatusResponse } from "@/types/deployment";

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
        deployment: {
          select: { previewUrl: true },
        },
      },
    });

    if (!siteRequest) {
      return NextResponse.json({ error: "Site request not found" }, { status: 404 });
    }

    if (siteRequest.userId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const response: StatusResponse = {
      requestId: siteRequest.id,
      status: siteRequest.status.toLowerCase() as StatusResponse["status"],
      previewUrl: siteRequest.deployment?.previewUrl ?? undefined,
      errorMessage: siteRequest.errorMessage ?? undefined,
      updatedAt: siteRequest.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
