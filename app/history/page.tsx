"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function HistoryPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("analyses")
        .select("*")
        .order("created_at", { ascending: false });
      setAnalyses(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  function loadAnalysis(result: any) {
    sessionStorage.setItem("medlens_result", JSON.stringify(result));
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Past Analyses</h1>
        {loading && <p className="text-gray-400 text-sm">Loading...</p>}
        {!loading && analyses.length === 0 && (
          <p className="text-gray-400 text-sm">No past analyses found.</p>
        )}
        <div className="space-y-4">
          {analyses.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm cursor-pointer hover:border-[#0EA5E9] transition"
              onClick={() => loadAnalysis(a.result)}
            >
              <p className="text-sm font-semibold text-[#0F172A]">
                {a.result?.analysis?.patient_summary?.conditions?.join(", ") || "Unknown conditions"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(a.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}