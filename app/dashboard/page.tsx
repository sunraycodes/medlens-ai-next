"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AskResponse, ProcessResponse, RiskSeverity } from "@/types";
import { isExtractionError } from "@/types";
import PatientPanel from "@/components/PatientPanel";
import Link from "next/link";

const SEVERITY_STYLES: Record<RiskSeverity, string> = {
  high: "border-red-300 bg-red-50 text-red-800",
  medium: "border-amber-300 bg-amber-50 text-amber-800",
  low: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

const SEVERITY_BAR: Record<RiskSeverity, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-emerald-500",
};

const NODE_COLORS: Record<string, string> = {
  patient: "#0EA5E9",
  condition: "#8B5CF6",
  medication: "#14B8A6",
  allergy: "#EF4444",
};

// ── Knowledge Graph ──────────────────────────────────────────
function KnowledgeGraph({ nodes, edges }: { nodes: any[]; edges: any[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    if (!nodes.length) return;
    const W = 700, H = 400;
    const cx = W / 2, cy = H / 2;
    const pos: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, i) => {
      if (n.type === "patient") {
        pos[n.id] = { x: cx, y: cy };
      } else {
        const angle = (2 * Math.PI * (i - 1)) / (nodes.length - 1);
        const r = 150;
        pos[n.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
      }
    });
    setPositions(pos);
  }, [nodes]);

  function onMouseDown(id: string, e: React.MouseEvent) {
    e.preventDefault();
    const pos = positions[id];
    dragOffset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    setDragging(id);
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging) return;
      setPositions(prev => ({
        ...prev,
        [dragging]: { x: e.clientX - dragOffset.current.dx, y: e.clientY - dragOffset.current.dy }
      }));
    }
    function onUp() { setDragging(null); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging]);

  if (!nodes.length) return <p className="text-sm text-gray-400">No graph data.</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-[#F8FAFC]">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-5 py-3 border-b border-gray-100 bg-white">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500 capitalize">
            <span className="h-3 w-3 rounded-full" style={{ background: color }} />
            {type}
          </div>
        ))}
      </div>
      <svg ref={svgRef} width="100%" viewBox="0 0 700 400" className="select-none">
        {/* Edges */}
        {edges.map((e, i) => {
          const s = positions[e.source];
          const t = positions[e.target];
          if (!s || !t) return null;
          return (
            <g key={i}>
              <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 3" />
              <text
                x={(s.x + t.x) / 2}
                y={(s.y + t.y) / 2 - 6}
                textAnchor="middle"
                fontSize="9"
                fill="#94A3B8"
              >
                {e.relation.replace(/_/g, " ")}
              </text>
            </g>
          );
        })}
        {/* Nodes */}
        {nodes.map((n) => {
          const p = positions[n.id];
          if (!p) return null;
          const color = NODE_COLORS[n.type] || "#94A3B8";
          const r = n.type === "patient" ? 36 : 30;
          const words = n.label.split(" ");
          const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
          const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");
          return (
            <g
              key={n.id}
              transform={`translate(${p.x},${p.y})`}
              onMouseDown={(e) => onMouseDown(n.id, e)}
              style={{ cursor: "grab" }}
            >
              <circle r={r} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" />
              <text textAnchor="middle" fontSize={n.type === "patient" ? "11" : "9"} fontWeight="600" fill={color}>
                {line2 ? (
                  <>
                    <tspan x="0" dy="-0.4em">{line1}</tspan>
                    <tspan x="0" dy="1.2em">{line2}</tspan>
                  </>
                ) : (
                  <tspan dy="0.35em">{line1}</tspan>
                )}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<ProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askResult, setAskResult] = useState<AskResponse | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("medlens_result");
    const err = sessionStorage.getItem("medlens_error");
    if (raw) setData(JSON.parse(raw));
    else if (err) { setError(err); sessionStorage.removeItem("medlens_error"); }
    else router.replace("/upload");
  }, [router]);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setAskLoading(true);
    setAskResult(null);
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      setAskResult(await res.json());
    } catch (err) {
      setAskResult({ answer: err instanceof Error ? err.message : "Unknown error", sources: [] });
    } finally { setAskLoading(false); }
  }

  async function handleExportPdf() {
    if (!data) return;
    const res = await fetch("/api/export-pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctor_summary: data.doctor_summary }) });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "doctor_summary.pdf"; a.click();
    URL.revokeObjectURL(url);
  }

  if (error) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-red-600">{error}</p>
      <button onClick={() => router.replace("/upload")} className="rounded-xl bg-[#0EA5E9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0369A1]">Back to upload</button>
    </main>
  );

  if (!data) return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-4 border-[#0EA5E9] border-t-transparent animate-spin" />
        <p className="text-gray-400 text-sm">Loading dashboard...</p>
      </div>
    </main>
  );

  const { analysis, trends, doctor_summary, extracted_reports, knowledge_graph } = data;

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Patient Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">Clinical summary across all uploaded reports</p>
          </div>
          <div className="flex gap-3">
            <Link href="/history" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-[#0EA5E9] hover:text-[#0EA5E9] transition">
            History
            </Link>
            <PatientPanel
              conditions={analysis.patient_summary.conditions}
              medications={analysis.patient_summary.current_medications}
              riskFlags={analysis.risk_flags}
            />
            <button
              onClick={handleExportPdf}
              className="rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0EA5E9]/20 transition hover:bg-[#0369A1]"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Patient Overview */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A] flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-[#0EA5E9]" /> Patient Overview
          </h2>
          <div className="grid grid-cols-2 gap-5 text-sm sm:grid-cols-4">
            {[
              { label: "Age", value: analysis.patient_summary.age ?? "Unknown" },
              { label: "Conditions", value: analysis.patient_summary.conditions.join(", ") || "None" },
              { label: "Medications", value: analysis.patient_summary.current_medications.join(", ") || "None" },
              { label: "Allergies", value: analysis.patient_summary.allergies.join(", ") || "None" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-[#F8FAFC] p-3">
                <p className="text-xs font-semibold text-[#0EA5E9] uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-[#0F172A] leading-snug">{String(item.value)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Risk Flags */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A] flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-red-500" /> Risk Flags
          </h2>
          <div className="space-y-2">
            {analysis.risk_flags.length === 0 && <p className="text-sm text-gray-400">No risk flags detected.</p>}
            {analysis.risk_flags.map((flag, i) => (
              <div key={i} className={`flex gap-3 rounded-xl border p-4 text-sm ${SEVERITY_STYLES[flag.severity]}`}>
                <div className={`mt-0.5 h-full w-1 rounded-full flex-shrink-0 ${SEVERITY_BAR[flag.severity]}`} />
                <div>
                  <p className="font-bold uppercase tracking-wide text-xs mb-1">
                    {flag.severity} · {flag.flag}
                  </p>
                  <p className="leading-relaxed">{flag.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline + Lab Trends side by side */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Timeline */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-[#0F172A] flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-[#14B8A6]" /> Health Timeline
            </h2>
            <ol className="space-y-4">
              {analysis.timeline.map((event, i) => (
                <li key={i} className="flex gap-4 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="h-7 w-7 rounded-full bg-[#0EA5E9]/10 border-2 border-[#0EA5E9] flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-[#0EA5E9]" />
                    </div>
                    {i < analysis.timeline.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-100 mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <span className="inline-block rounded-md bg-[#0EA5E9]/10 px-2 py-0.5 text-xs font-semibold text-[#0369A1] mb-1">
                      {event.date}
                    </span>
                    <p className="text-gray-600 leading-relaxed">{event.event}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Lab Trends */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-[#0F172A] flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-amber-400" /> Lab Trends
            </h2>
            {trends.length === 0 && <p className="text-sm text-gray-400">Not enough repeated lab values.</p>}
            <div className="space-y-4">
              {trends.map((trend, i) => {
                const isUp = trend.direction === "increasing";
                const isDown = trend.direction === "decreasing";
                const color = isUp ? "#EF4444" : isDown ? "#22C55E" : "#94A3B8";
                const arrow = isUp ? "↑" : isDown ? "↓" : "→";
                const pct = Math.min(Math.abs(trend.change / trend.first_value) * 100 * 3, 100);
                return (
                  <div key={i} className="rounded-xl bg-[#F8FAFC] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-[#0F172A]">{trend.test}</p>
                      <span className="text-sm font-bold" style={{ color }}>
                        {arrow} {trend.change > 0 ? "+" : ""}{trend.change} {trend.unit}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-200 mb-2">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{trend.first_date}: {trend.first_value} {trend.unit}</span>
                      <span>{trend.last_date}: {trend.last_value} {trend.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Knowledge Graph */}
        {knowledge_graph && (
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-[#0F172A] flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-purple-500" /> Patient Knowledge Graph
            </h2>
            <p className="text-xs text-gray-400 mb-4">Drag nodes to explore relationships</p>
            <KnowledgeGraph nodes={knowledge_graph.nodes} edges={knowledge_graph.edges} />
          </section>
        )}

        {/* Doctor Summary */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A] flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-[#0369A1]" /> Doctor Handoff Summary
          </h2>
          <div className="rounded-xl bg-[#F8FAFC] p-5">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
              {doctor_summary.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*/g, "")}
            </pre>
          </div>
        </section>

        {/* Ask a question */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A] flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-[#14B8A6]" /> Ask About This Patient
          </h2>
          <form onSubmit={handleAsk} className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Has the patient's HbA1c improved over time?"
              className="flex-1 rounded-xl border border-gray-200 bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
            />
            <button
              type="submit"
              disabled={askLoading}
              className="rounded-xl bg-[#0EA5E9] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0369A1] disabled:opacity-60"
            >
              {askLoading ? "..." : "Ask"}
            </button>
          </form>
          {askResult && (
            <div className="mt-4 rounded-xl border border-[#0EA5E9]/20 bg-[#0EA5E9]/5 p-4 text-sm">
              <p className="text-gray-700 leading-relaxed">{askResult.answer}</p>
              {askResult.sources.length > 0 && (
                <p className="mt-2 text-xs text-gray-400">
                  Sources: {askResult.sources.join(", ")}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Extraction issues */}
        {extracted_reports.some(isExtractionError) && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            <h2 className="mb-2 font-semibold">Extraction Issues</h2>
            <ul className="list-inside list-disc space-y-1">
              {extracted_reports.filter(isExtractionError).map((e, i) => (
                <li key={i}>{e.filename}: {e.error}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}