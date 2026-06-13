// ============================================================
// MedLens AI — Algorithmic Trend Detection
// Direct port of parse_date_safe() and compute_trends() from
// backend/main.py. No AI involved — pure numeric comparison
// of lab values across reports.
// ============================================================

import type {
  ExtractedReport,
  ExtractedReportEntry,
  Trend,
  TrendPoint,
} from "@/types";
import { isExtractionError } from "@/types";

const DATE_FORMATS: Array<(s: string) => Date | null> = [
  // "YYYY-MM-DD" or "YYYY-MM"
  (s) => {
    const m = s.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, m[3] ? Number(m[3]) : 1);
  },
  // "DD-MM-YYYY"
  (s) => {
    const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (!m) return null;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  },
  // "DD/MM/YYYY"
  (s) => {
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  },
  // "MM/DD/YYYY"
  (s) => {
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  },
  // "YYYY/MM/DD"
  (s) => {
    const m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  },
];

/**
 * Parses a date string in any of several common formats.
 * Falls back to the minimum possible date (mirrors datetime.min)
 * if the string is empty or unparseable, so unsorted/undated
 * reports sort first — matching the Python implementation.
 */
export function parseDateSafe(dateStr: string | undefined | null): Date {
  if (!dateStr) return new Date(-8_640_000_000_000_000); // JS min date

  for (const parser of DATE_FORMATS) {
    const result = parser(dateStr);
    if (result && !isNaN(result.getTime())) return result;
  }

  return new Date(-8_640_000_000_000_000);
}

/**
 * Algorithmically detects trends in lab values across reports.
 * For each test name, tracks its value over time and reports
 * whether it is increasing, decreasing, or stable between the
 * first and last recorded values. No AI is used.
 */
export function computeTrends(validReports: ExtractedReport[]): Trend[] {
  const testHistory = new Map<string, TrendPoint[]>();

  for (const report of validReports) {
    const date = report.date || "";
    for (const lab of report.lab_values || []) {
      const testName = (lab.test || "").trim();
      const valueStr = lab.value || "";
      if (!testName || !valueStr) continue;

      // Skip composite values like blood pressure "148/95 mmHg"
      if (valueStr.includes("/")) continue;

      let num = "";
      let unit = "";
      for (const ch of valueStr) {
        if (/[0-9.]/.test(ch)) {
          num += ch;
        } else if (num) {
          unit += ch;
        }
      }

      const numVal = parseFloat(num);
      if (isNaN(numVal)) continue;

      if (!testHistory.has(testName)) testHistory.set(testName, []);
      testHistory.get(testName)!.push({
        date,
        value: numVal,
        unit: unit.trim(),
      });
    }
  }

  const trends: Trend[] = [];

  for (const [testName, history] of testHistory.entries()) {
    if (history.length < 2) continue;

    history.sort(
      (a, b) => parseDateSafe(a.date).getTime() - parseDateSafe(b.date).getTime()
    );

    const first = history[0];
    const last = history[history.length - 1];
    const delta = Math.round((last.value - first.value) * 100) / 100;

    let direction: Trend["direction"];
    if (delta > 0) direction = "increasing";
    else if (delta < 0) direction = "decreasing";
    else direction = "stable";

    trends.push({
      test: testName,
      history,
      direction,
      change: delta,
      unit: last.unit,
      first_value: first.value,
      first_date: first.date,
      last_value: last.value,
      last_date: last.date,
    });
  }

  return trends;
}

/** Type guard helper for filtering out extraction errors before computing trends */
export function getValidReports(
  entries: ExtractedReportEntry[]
): ExtractedReport[] {
  return entries.filter(
    (e): e is ExtractedReport => !isExtractionError(e)
  );
}
