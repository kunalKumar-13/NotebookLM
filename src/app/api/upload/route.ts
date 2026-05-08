import { NextRequest, NextResponse } from "next/server";
import { processAndIndexDocument } from "@/lib/rag";
import pdfParse from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    let text = "";
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else {
      // Assume text-based file
      text = buffer.toString("utf-8");
    }

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 400 });
    }

    const result = await processAndIndexDocument(text, file.name);

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
