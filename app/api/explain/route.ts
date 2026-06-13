import { NextRequest, NextResponse } from "next/server";
import { callAIForJSON } from "@/lib/ai";
import { PATIENT_EXPLAIN_PROMPT } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conditions, medications, risk_flags } = body;

    if (!conditions?.length) {
      return NextResponse.json(
        { error: "No conditions provided" },
        { status: 400 }
      );
    }

    const prompt = PATIENT_EXPLAIN_PROMPT.replace(
      "<<json_data>>",
      JSON.stringify({ conditions, medications, risk_flags }, null, 2)
    );

    const { parsed, raw } = await callAIForJSON(prompt, 2);

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to generate explanation", raw },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/explain] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}