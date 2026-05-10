import { NextRequest, NextResponse } from "next/server";
import { processAndIndexDocument } from "@/lib/rag";
import { Document } from "@langchain/core/documents";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Polyfills for pdf-parse in Node environments
    if (typeof global !== "undefined" && !(global as any).DOMMatrix) {
      (global as any).DOMMatrix = class DOMMatrix {};
    }
    if (typeof global !== "undefined" && !(global as any).DOMPoint) {
      (global as any).DOMPoint = class DOMPoint {};
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    let text = "";
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = pdfParseModule.default || pdfParseModule;
      
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else {
      text = buffer.toString("utf-8");
    }

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 400 });
    }

    const docs = [new Document({ pageContent: text, metadata: { source: file.name } })];
    const result = await processAndIndexDocument(docs, file.name);

    return NextResponse.json({ 
      success: true, 
      message: "Document indexed successfully",
      chunks: result.chunksProcessed 
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to process file" }, { status: 500 });
  }
}
