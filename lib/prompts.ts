// ============================================================
// MedLens AI — Prompt Templates
// Direct port of backend/prompts.py
// ============================================================

export const EXTRACTION_PROMPT = `You are a medical data extraction system. Extract structured information from the report below.

Return ONLY valid JSON, no markdown, no explanation, in this exact format:
{
  "date": "YYYY-MM",
  "age": <number or null>,
  "diagnoses": ["list of diagnosed conditions"],
  "lab_values": [{"test": "name", "value": "value with unit", "flag": "normal/elevated/low/diabetic_range/etc"}],
  "medications": ["list of medications with dosage"],
  "allergies": ["list of allergies, empty if none mentioned"],
  "notes": "any clinically relevant note, especially about follow-ups or missing evaluations"
}

REPORT TEXT:
<<report_text>>
`;

export const ANALYSIS_PROMPT = `You are a clinical decision support AI helping a doctor quickly understand a patient's history across multiple reports.

Below is structured data extracted from <<n>> medical reports for one patient, in chronological order.

DATA:
<<json_data>>

Based on this data, return ONLY valid JSON in this exact format:
{
  "patient_summary": {
    "age": <latest age>,
    "conditions": ["list of all current/ongoing conditions"],
    "current_medications": ["list of current medications"],
    "allergies": ["list of all allergies"]
  },
  "timeline": [
    {"date": "YYYY-MM", "event": "short description of key event/change"}
  ],
  "risk_flags": [
    {"severity": "high/medium/low", "flag": "short title", "explanation": "1-2 sentence clinical reasoning, citing which reports/dates support this"}
  ]
}

Look specifically for:
- Trends across reports (e.g. gradually worsening lab values)
- Missed follow-ups (a concerning value in one report with no evaluation/action in later reports)
- Potential medication interactions or concerns given the conditions
- Any contradictions between reports
`;

export const DOCTOR_SUMMARY_PROMPT = `Based on the following patient analysis JSON, write a concise one-page doctor handoff summary in plain text (not JSON). 
It should be readable in under 30 seconds. Use clear section headers: PATIENT OVERVIEW, KEY TIMELINE, ACTIVE RISK FLAGS, CURRENT MEDICATIONS, ALLERGIES.
Be direct and clinical. No fluff.

DATA:
<<json_data>>
`;

export const RAG_QA_PROMPT = `You are a clinical assistant. Use the retrieved report excerpts below to answer the doctor's question. Be concise and cite which file supports your answer.

RETRIEVED EXCERPTS:
<<context>>

DOCTOR'S QUESTION: <<question>>

Answer in 2-4 sentences, clinical tone, citing source filenames where relevant.`;



export const PATIENT_EXPLAIN_PROMPT = `You are a patient-friendly medical assistant. A patient wants to understand their health conditions in simple, non-scary language.

Given this patient data:
<<json_data>>

Return ONLY valid JSON in this exact format:
{
  "patient_explanation": [
    {
      "condition": "condition name",
      "plain_english": "2-3 sentence simple explanation of what this condition means, no jargon",
      "symptoms_to_watch": ["symptom 1", "symptom 2", "symptom 3"],
      "lifestyle_tips": ["tip 1", "tip 2", "tip 3"],
      "seek_urgent_care_if": ["warning sign 1", "warning sign 2"]
    }
  ]
}

Rules:
- plain_english: explain like talking to a 16-year-old, warm and reassuring tone
- symptoms_to_watch: practical, specific, 3-5 items
- lifestyle_tips: actionable, specific, 3-5 items  
- seek_urgent_care_if: clear warning signs only, 2-3 items
- Cover every condition in the conditions list
`;