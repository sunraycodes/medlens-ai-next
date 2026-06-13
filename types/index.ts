// ============================================================
// MedLens AI — Shared Types
// Mirrors the JSON shapes produced by the backend pipeline
// (extraction -> analysis -> trends -> knowledge graph -> summary)
// ============================================================

/** A single lab value parsed from a report */
export interface LabValue {
  test: string;
  value: string; // e.g. "7.4%", "148/95 mmHg"
  flag?: string; // e.g. "normal", "elevated", "diabetic_range"
}

/** Structured data extracted from a single report via LLM extraction */
export interface ExtractedReport {
  date?: string; // "YYYY-MM"
  age?: number | null;
  diagnoses?: string[];
  lab_values?: LabValue[];
  medications?: string[];
  allergies?: string[];
  notes?: string;
  source_file: string;
}

/** Error variant returned when a file could not be processed */
export interface ExtractionError {
  error: "empty_or_unreadable" | "parse_failed";
  filename: string;
  raw?: string;
}

export type ExtractedReportEntry = ExtractedReport | ExtractionError;

export function isExtractionError(
  entry: ExtractedReportEntry
): entry is ExtractionError {
  return "error" in entry;
}

/** Aggregated patient summary across all reports */
export interface PatientSummary {
  age: number | null;
  conditions: string[];
  current_medications: string[];
  allergies: string[];
}

/** A single event in the chronological health timeline */
export interface TimelineEvent {
  date: string; // "YYYY-MM"
  event: string;
}

/** Severity levels for risk flags */
export type RiskSeverity = "high" | "medium" | "low";

/** A clinically significant risk identified across reports */
export interface RiskFlag {
  severity: RiskSeverity;
  flag: string;
  explanation: string;
}

/** Full cross-report analysis produced by the AI */
export interface Analysis {
  patient_summary: PatientSummary;
  timeline: TimelineEvent[];
  risk_flags: RiskFlag[];
}

/** A single dated data point in a lab value trend */
export interface TrendPoint {
  date: string;
  value: number;
  unit: string;
}

/** Direction of change for a tracked lab value */
export type TrendDirection = "increasing" | "decreasing" | "stable";

/** Algorithmically computed trend for a single lab test across reports */
export interface Trend {
  test: string;
  history: TrendPoint[];
  direction: TrendDirection;
  change: number;
  unit: string;
  first_value: number;
  first_date: string;
  last_value: number;
  last_date: string;
}

/** Node types in the patient knowledge graph */
export type KnowledgeGraphNodeType =
  | "patient"
  | "condition"
  | "medication"
  | "allergy";

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: KnowledgeGraphNodeType;
}

export type KnowledgeGraphRelation =
  | "diagnosed_with"
  | "prescribed"
  | "allergic_to";

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  relation: KnowledgeGraphRelation;
}

export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

/** Full response shape returned by POST /api/process */
export interface ProcessResponse {
  extracted_reports: ExtractedReportEntry[];
  analysis: Analysis;
  doctor_summary: string;
  trends: Trend[];
  knowledge_graph: KnowledgeGraph;
}

/** Request/response shapes for POST /api/ask */
export interface AskRequest {
  question: string;
}

export interface AskResponse {
  answer: string;
  sources: string[];
}

/** Request shape for POST /api/export-pdf */
export interface ExportPdfRequest {
  doctor_summary: string;
}
