import { NextRequest, NextResponse } from "next/server";
import { processAndIndexDocument } from "@/lib/rag";
import { Document } from "@langchain/core/documents";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Basic Server Setup & Polyfills
    // Next.js Edge/Serverless environments sometimes lack these which pdf.js (internal to pdf-parse) needs
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

    // 2. Document Extraction Logic
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      try {
        // We use dynamic import for pdf-parse to handle Next.js/Turbopack resolution quirks
        const pdfParseModule = await import("pdf-parse");
        
        // Handle different export patterns (CommonJS vs ESM interop)
        let pdfParse = pdfParseModule.default;
        if (typeof pdfParse !== "function") {
           // @ts-ignore
           pdfParse = pdfParseModule;
        }
        if (typeof pdfParse !== "function") {
          // @ts-ignore
          pdfParse = pdfParseModule.pdfParse;
        }

        if (typeof pdfParse !== "function") {
          throw new Error("Could not resolve pdf-parse as a function. Check module exports.");
        }

        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } catch (pdfErr: any) {
        console.error("PDF Parsing Internal Error:", pdfErr);
        return NextResponse.json({ error: `PDF Processing Failed: ${pdfErr.message}` }, { status: 500 });
      }
    } else {
      // Handle plain text or CSV as text
      text = buffer.toString("utf-8");
    }

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "The document seems to be empty or unreadable." }, { status: 400 });
    }

    // 3. Trigger RAG Pipeline
    const docs = [new Document({ 
      pageContent: text, 
      metadata: { 
        source: file.name,
        type: file.type 
      } 
    })];
    
    const result = await processAndIndexDocument(docs, file.name);

    return NextResponse.json({ 
      success: true, 
      message: "Document indexed successfully",
      chunks: result.chunksProcessed 
    });

  } catch (error: any) {
    console.error("Ultimate Upload Catch:", error);
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred during processing." 
    }, { status: 500 });
  }
}
