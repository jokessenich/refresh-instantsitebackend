export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      messages: [{ role: "user", content: "Say hello in exactly 5 words." }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "no text";
    return NextResponse.json({ status: "ok", response: text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ status: "error", error: msg }, { status: 500 });
  }
}
