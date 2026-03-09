// src/app/api/uploads/route.ts

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { UploadInputSchema } from "@/types/site-request";
import { createUpload } from "@/services/upload.service";

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();

    const parsed = UploadInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const siteRequestId = body.siteRequestId as string | undefined;

    const result = await createUpload(userId, parsed.data, siteRequestId);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logger.error("Upload failed", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
