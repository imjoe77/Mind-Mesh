/*
  app/api/pdf/route.js
  
  Extracts text from uploaded PDFs.
  Primary:  pdf-parse   (handles most text-based PDFs)
  Fallback: pdfreader   (handles some PDFs pdf-parse misses)
  
  Install: npm install pdf-parse pdfreader
*/
import { createRequire } from "module";
const require = createRequire(import.meta.url);

/* ── pdf-parse extractor ── */
async function extractWithPdfParse(buffer) {
  try {
    const pdfParse = require("pdf-parse");
    const result   = await pdfParse(buffer, { max: 0 }); // max:0 = all pages
    return result.text?.trim() || "";
  } catch (e) {
    console.warn("[PDF] pdf-parse failed:", e.message);
    return null;
  }
}

/* ── pdfreader extractor ── */
function extractWithPdfReader(buffer) {
  return new Promise((resolve) => {
    let text = "";
    const timeout = setTimeout(() => resolve(text.trim()), 12000);
    try {
      const { PdfReader } = require("pdfreader");
      new PdfReader().parseBuffer(buffer, (err, item) => {
        if (err) return;
        if (!item) { clearTimeout(timeout); resolve(text.trim()); return; }
        if (item.text) text += item.text + " ";
      });
    } catch (e) {
      console.warn("[PDF] pdfreader failed:", e.message);
      clearTimeout(timeout);
      resolve("");
    }
  });
}

export async function POST(req) {
  try {
    let formData;
    try {
      formData = await req.formData();
    } catch {
      return Response.json({ error: "Invalid request. Send file as multipart/form-data." }, { status: 400 });
    }

    const file = formData.get("file");
    if (!file) {
      return Response.json({ error: "No file received. Key must be 'file'." }, { status: 400 });
    }

    const buffer   = Buffer.from(await file.arrayBuffer());
    const fileName = (file.name || "").toLowerCase();

    // Plain text — no extraction needed
    if (file.type === "text/plain" || fileName.endsWith(".txt")) {
      const text = buffer.toString("utf-8").slice(0, 12000);
      return Response.json({ success: true, documentText: text, charCount: text.length });
    }

    // Try pdf-parse first
    let documentText = await extractWithPdfParse(buffer);

    // Fallback to pdfreader
    if (!documentText || documentText.length < 20) {
      console.log("[PDF] pdf-parse empty, trying pdfreader...");
      documentText = await extractWithPdfReader(buffer);
    }

    // Still nothing = scanned/image PDF
    if (!documentText || documentText.trim().length < 20) {
      return Response.json({
        error: "scanned",
        isScanned: true,
      }, { status: 422 });
    }

    const trimmed = documentText.slice(0, 12000);
    return Response.json({ success: true, documentText: trimmed, charCount: trimmed.length });

  } catch (err) {
    console.error("[PDF_ROUTE] Unhandled:", err);
    return Response.json({ error: `Server error: ${err.message || "Unknown"}` }, { status: 500 });
  }
}
