// src/app/api/site-requests/route.ts

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { SiteRequestInputSchema } from "@/types/site-request";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = SiteRequestInputSchema.safeParse(body);
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

    const input = parsed.data;

    // TODO: In production, extract userId from auth session/token
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Map business type to Prisma enum
    const businessTypeMap: Record<string, string> = {
      contractor: "CONTRACTOR",
      restaurant: "RESTAURANT",
      therapist: "THERAPIST",
      consultant: "CONSULTANT",
      photographer: "PHOTOGRAPHER",
      "local-service": "LOCAL_SERVICE",
    };

    const siteRequest = await prisma.siteRequest.create({
      data: {
        userId,
        businessName: input.businessName,
        businessType: businessTypeMap[input.businessType] as any,
        location: input.location,
        primaryGoal: input.primaryGoal,
        services: input.services,
        about: input.about,
        differentiators: input.differentiators,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        colorPreference: input.colorPreference,
        fontPreference: input.fontPreference,
        siteVibe: input.siteVibe,
        status: "DRAFT",
      },
    });

    // Link uploaded assets if provided
    if (input.uploadedImageIds.length > 0 || input.uploadedLogoId) {
      const allIds = [...input.uploadedImageIds];
      if (input.uploadedLogoId) allIds.push(input.uploadedLogoId);

      await prisma.uploadedAsset.updateMany({
        where: { id: { in: allIds }, userId },
        data: { siteRequestId: siteRequest.id },
      });
    }

    logger.info("Site request created", {
      requestId: siteRequest.id,
      businessType: input.businessType,
    });

    return NextResponse.json(
      {
        id: siteRequest.id,
        status: siteRequest.status,
        createdAt: siteRequest.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Failed to create site request", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
