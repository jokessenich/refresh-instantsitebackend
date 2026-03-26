export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Deploy is now handled automatically during generation." },
    { status: 200 }
  );
}
