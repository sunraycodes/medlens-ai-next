import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-57px)] bg-[#F8FAFC]">
      <section className="mx-auto max-w-6xl px-6 py-20 flex flex-col items-center text-center gap-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#0EA5E9]/30 bg-[#0EA5E9]/10 px-4 py-1.5 text-sm font-medium text-[#0369A1]">
          <span className="h-2 w-2 rounded-full bg-[#0EA5E9] animate-pulse" />
          AI-Powered Clinical Decision Support
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-[#0F172A] max-w-3xl leading-tight">
          Turn scattered reports into{" "}
          <span className="text-[#0EA5E9]">clinical clarity</span>
        </h1>

        <p className="max-w-2xl text-lg text-gray-500 leading-relaxed">
          Upload a patient&apos;s medical reports and get a structured timeline,
          risk flags, lab trends, knowledge graph, and a one-page doctor handoff
          summary — in under a minute.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/upload"
            className="rounded-xl bg-[#0EA5E9] px-8 py-3.5 font-semibold text-white shadow-lg shadow-[#0EA5E9]/25 transition hover:bg-[#0369A1] hover:shadow-[#0369A1]/25"
          >
            Start Analysis →
          </Link>
          <Link
            href="#features"
            className="rounded-xl border border-gray-200 px-8 py-3.5 font-medium text-gray-600 transition hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
          >
            See Features
          </Link>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: "🗂", title: "Structured Extraction", desc: "Diagnoses, medications, lab values, and allergies pulled from every report automatically.", color: "#0EA5E9" },
            { icon: "📅", title: "Health Timeline", desc: "Chronological view of key clinical events across all uploaded reports.", color: "#14B8A6" },
            { icon: "🚨", title: "Risk Flags", desc: "AI-identified high, medium, and low severity risks with clinical reasoning.", color: "#EF4444" },
            { icon: "📈", title: "Lab Trends", desc: "Track how lab values change over time and detect worsening patterns.", color: "#F59E0B" },
            { icon: "🕸", title: "Knowledge Graph", desc: "Interactive visual map of patient conditions, medications, and allergies.", color: "#8B5CF6" },
            { icon: "👤", title: "Patient View", desc: "Plain-language explanations, lifestyle tips, and urgent care guidance for patients.", color: "#22C55E" },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-[#0EA5E9]/30 transition-all">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: `${f.color}18` }}>
                {f.icon}
              </div>
              <h3 className="mb-1.5 font-semibold text-[#0F172A]">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 flex flex-col items-center gap-5 text-center">
          <h2 className="text-2xl font-bold text-[#0F172A]">Ready to analyse a patient?</h2>
          <p className="text-gray-500 max-w-md">Upload PDF or text reports and get a full clinical summary in seconds.</p>
          <Link href="/upload" className="rounded-xl bg-[#0EA5E9] px-8 py-3.5 font-semibold text-white shadow-lg shadow-[#0EA5E9]/25 transition hover:bg-[#0369A1]">
            Upload Reports →
          </Link>
        </div>
      </section>
    </main>
  );
}