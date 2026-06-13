// ============================================================
// MedLens AI — POST /api/process
// Direct port of @app.post("/process") from backend/main.py
//
// Pipeline:
// 1. Clear and re-index the document store (RAG)
// 2. Extract structured data from each uploaded report via LLM
// 3. Sort valid reports chronologically
// 4. Run cross-report AI analysis (summary, timeline, risk flags)
// 5. Compute lab trends algorithmically (no AI)
// 6. Build a patient knowledge graph (no AI)
// 7. Generate a one-page doctor handoff summary via LLM
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { callAI, callAIForJSON } from "@/lib/ai";
import {
  ANALYSIS_PROMPT,
  DOCTOR_SUMMARY_PROMPT,
  EXTRACTION_PROMPT,
} from "@/lib/prompts";
import { extractTextFromFile } from "@/lib/extractText";
import { computeTrends, getValidReports, parseDateSafe } from "@/lib/trends";
import { buildKnowledgeGraph } from "@/lib/knowledgeGraph";
import { getDocumentStore } from "@/lib/documentStore";
import type {
  Analysis,
  ExtractedReport,
  ExtractedReportEntry,
  ProcessResponse,
} from "@/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json(
        { error: "No files provided. Use field name 'files'." },
        { status: 400 }
      );
    }

    const store = getDocumentStore();
    store.clear();

    const extractedReports: ExtractedReportEntry[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const content = Buffer.from(arrayBuffer);
      const text = await extractTextFromFile(file.name, content);

      if (!text.trim()) {
        extractedReports.push({
          error: "empty_or_unreadable",
          filename: file.name,
        });
        continue;
      }

      // Index for RAG
      try {
        store.add(file.name, text);
      } catch {
        // mirror the Python try/except: indexing failure shouldn't
        // block extraction
      }

      const prompt = EXTRACTION_PROMPT.replace("<<report_text>>", text);
      const { parsed, raw } = await callAIForJSON<ExtractedReport>(prompt, 2);

      if (parsed) {
        extractedReports.push({ ...parsed, source_file: file.name });
      } else {
        extractedReports.push({
          error: "parse_failed",
          raw: raw ?? undefined,
          filename: file.name,
        });
      }
    }

    const validReports = getValidReports(extractedReports).sort(
      (a, b) =>
        parseDateSafe(a.date).getTime() - parseDateSafe(b.date).getTime()
    );

    let analysisPrompt = ANALYSIS_PROMPT.replace(
      "<<n>>",
      String(validReports.length)
    );
    analysisPrompt = analysisPrompt.replace(
      "<<json_data>>",
      JSON.stringify(validReports, null, 2)
    );

    const analysisResult = await callAI(analysisPrompt);
    const analysis: Analysis = JSON.parse(analysisResult);

    const trends = computeTrends(validReports);
    const knowledgeGraph = buildKnowledgeGraph(analysis.patient_summary);

    const summaryPrompt = DOCTOR_SUMMARY_PROMPT.replace(
      "<<json_data>>",
      JSON.stringify(analysis, null, 2)
    );
    const doctorSummary = await callAI(summaryPrompt);

    const response: ProcessResponse = {
      extracted_reports: extractedReports,
      analysis,
      doctor_summary: doctorSummary,
      trends,
      knowledge_graph: knowledgeGraph,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/process] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
