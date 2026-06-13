"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Extracting structured data from reports...",
  "Building health timeline...",
  "Detecting risk flags and trends...",
  "Generating doctor handoff summary...",
];

export default function ProcessingPage() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-medical-200 border-t-medical-600" />
      <h1 className="text-xl font-semibold">Analyzing patient reports</h1>
      <p className="animate-fade-in text-sm text-muted-foreground" key={step}>
        {STEPS[step]}
      </p>
    </main>
  );
}
