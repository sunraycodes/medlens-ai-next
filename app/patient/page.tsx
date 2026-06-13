"use client";

import { useEffect, useState } from "react";

interface PatientCondition {
  condition: string;
  plain_english: string;
  symptoms_to_watch: string[];
  lifestyle_tips: string[];
  seek_urgent_care_if: string[];
}

export default function PatientPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PatientCondition[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<{
    conditions: string[];
    medications: string[];
    risk_flags: { severity: string; flag: string; explanation: string }[];
  } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("medlens_patient_context");
    if (!raw) {
      setError("No patient data found. Please go back and process reports first.");
      return;
    }
    const ctx = JSON.parse(raw);
    setContext(ctx);
    fetchExplanation(ctx);
  }, []);

  async function fetchExplanation(ctx: typeof context) {
    if (!ctx) return;
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 2 min max
    
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ctx),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
        setData(json.patient_explanation);
    } catch (e: any) {
      if (e.name === "AbortError") {
        setError("Request timed out. The AI models are slow right now — please try again.");
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-700">Patient View</h1>
          <p className="text-sm text-gray-500">
            Plain-language explanations of your health conditions
          </p>
        </div>
        <button
          onClick={() => window.close()}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ✕ Close
        </button>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        {/* Summary bar */}
        {context && (
          <div className="bg-white rounded-xl border border-blue-100 p-5 flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Conditions</p>
              <p className="text-gray-700">{context.conditions.join(", ")}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Medications</p>
              <p className="text-gray-700">{context.medications.join(", ") || "None"}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-20 space-y-4">
            <div className="h-10 w-10 rounded-full border-4 border-[#0EA5E9] border-t-transparent animate-spin mx-auto" />
            <p className="text-[#0EA5E9] font-medium">
              Generating your personalised health guide...
            </p>
            <p className="text-sm text-gray-400">
              This may take up to 2 minutes with free AI models. Please keep this tab open.
            </p>
          </div>
        )}
        {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 space-y-3">
        <p>{error}</p>
        <button
          onClick={() => context && fetchExplanation(context)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
        Retry
        </button>
        </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">
            {error}
          </div>
        )}

        {data && data.map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
            {/* Condition header */}
            <div className="bg-blue-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">{item.condition}</h2>
            </div>

            {/* Plain english */}
            <div className="px-6 py-4 border-b border-blue-50">
              <p className="text-gray-700 leading-relaxed">{item.plain_english}</p>
            </div>

            {/* Three columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-blue-50">
              {/* Symptoms */}
              <div className="px-6 py-5">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">
                  ⚠ Symptoms to Watch
                </p>
                <ul className="space-y-2">
                  {item.symptoms_to_watch.map((s, j) => (
                    <li key={j} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-amber-400 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Lifestyle */}
              <div className="px-6 py-5">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">
                  ✓ Lifestyle Tips
                </p>
                <ul className="space-y-2">
                  {item.lifestyle_tips.map((t, j) => (
                    <li key={j} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Urgent care */}
              <div className="px-6 py-5">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3">
                  🚨 Seek Urgent Care If
                </p>
                <ul className="space-y-2">
                  {item.seek_urgent_care_if.map((w, j) => (
                    <li key={j} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-red-500 mt-0.5">•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}