// ============================================================
// MedLens AI — POST /api/export-pdf
// Direct port of @app.post("/export-pdf") from backend/main.py
//
// Takes { "doctor_summary": "..." } and returns a downloadable
// PDF. The Python version used ReportLab; this uses PDFKit with
// equivalent formatting rules:
//   - blank lines -> vertical spacing
//   - ALL-CAPS short lines -> bold section headers
//   - lines starting with "-" -> bullet points
//   - everything else -> normal paragraph text
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import type { ExportPdfRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ExportPdfRequest;
    const text = payload?.doctor_summary || "";

    const pdfBuffer = await buildSummaryPdf(text);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=doctor_summary.pdf",
      },
    });
  } catch (err) {
    console.error("[/api/export-pdf] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function buildSummaryPdf(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 54 }); // ~0.75in, like reportlab's letter default
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("MedLens AI \u2014 Doctor Handoff Summary", { align: "left" });
    doc.moveDown(1);

    const lines = text.split("\n");

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        doc.moveDown(0.6);
        continue;
      }

      if (line === line.toUpperCase() && line.length < 60) {
        // Section header (e.g. PATIENT OVERVIEW)
        doc.moveDown(0.3);
        doc.font("Helvetica-Bold").fontSize(13).text(line);
        doc.moveDown(0.2);
      } else if (line.startsWith("-")) {
        // Bullet point
        doc
          .font("Helvetica")
          .fontSize(11)
          .text(`\u2022 ${line.slice(1).trim()}`, { indent: 14 });
      } else {
        // Normal paragraph
        doc.font("Helvetica").fontSize(11).text(line);
      }
    }

    doc.end();
  });
}
