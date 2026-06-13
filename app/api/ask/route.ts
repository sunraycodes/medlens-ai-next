// ============================================================
// MedLens AI — POST /api/ask
// Direct port of @app.post("/ask") from backend/main.py
//
// Retrieves the top relevant report excerpts from the in-memory
// document store and asks the LLM to answer the doctor's
// question, citing source filenames.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import { RAG_QA_PROMPT } from "@/lib/prompts";
import { getDocumentStore } from "@/lib/documentStore";
import type { AskRequest, AskResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as AskRequest;
    const question = payload?.question || "";

    if (!question.trim()) {
      const response: AskResponse = {
        answer: "Please provide a question.",
        sources: [],
      };
      return NextResponse.json(response);
    }

    const store = getDocumentStore();
    const results = store.query(question, 3);

    if (!results.length) {
      const response: AskResponse = {
        answer:
          "No patient documents have been processed yet. Please upload reports first.",
        sources: [],
      };
      return NextResponse.json(response);
    }

    let context = "";
    for (const doc of results) {
      context += `\n[From ${doc.filename}]:\n${doc.text}\n`;
    }

    let prompt = RAG_QA_PROMPT.replace("<<context>>", context);
    prompt = prompt.replace("<<question>>", question);

    const answer = await callAI(prompt);

    const response: AskResponse = {
      answer,
      sources: results.map((r) => r.filename),
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/ask] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
