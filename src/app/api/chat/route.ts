import { NextRequest, NextResponse } from "next/server";
import { queryDocument } from "@/lib/rag";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    const result = await queryDocument(query);

    return NextResponse.json({ 
      success: true, 
      answer: result.answer,
      sources: result.sources
    });

  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate answer" }, { status: 500 });
  }
}
