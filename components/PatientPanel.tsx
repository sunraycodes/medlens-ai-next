"use client";

export default function PatientPanel({
  conditions,
  medications,
  riskFlags,
}: {
  conditions: string[];
  medications: string[];
  riskFlags: { severity: string; flag: string; explanation: string }[];
}) {
  function handleOpen() {
    // Pass data via sessionStorage so patient page can read it
    sessionStorage.setItem(
      "medlens_patient_context",
      JSON.stringify({ conditions, medications, risk_flags: riskFlags })
    );
    window.open("/patient", "_blank");
  }

  return (
    <button
      onClick={handleOpen}
      className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
    >
      👤 Patient View
    </button>
  );
}