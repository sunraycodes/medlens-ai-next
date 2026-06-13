"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ProcessResponse } from "@/types";

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const err = sessionStorage.getItem("medlens_error");
    if (err) {
      setError(err);
      sessionStorage.removeItem("medlens_error");
    }
  }, []);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? []);
    if (!newFiles.length) return;
    mergeFiles(newFiles);
    if (inputRef.current) inputRef.current.value = "";
  }

  function mergeFiles(newFiles: File[]) {
    setFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const merged = [...prev];
      for (const f of newFiles) {
        const key = `${f.name}-${f.size}`;
        if (!existingKeys.has(key)) {
          merged.push(f);
          existingKeys.add(key);
        }
      }
      return merged;
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".pdf") || f.name.endsWith(".txt")
    );
    mergeFiles(dropped);
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) {
      setError("Please select at least one report (.pdf or .txt).");
      return;
    }
    setError(null);
    setLoading(true);
    router.push("/processing");

    try {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);
      const res = await fetch("/api/process", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed: ${res.status}`);
      }
      const data: ProcessResponse = await res.json();
      sessionStorage.setItem("medlens_result", JSON.stringify(data));
      router.replace("/dashboard");
    } catch (err) {
      sessionStorage.setItem(
        "medlens_error",
        err instanceof Error ? err.message : "Unknown error"
      );
      router.replace("/upload");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-57px)] bg-[#F8FAFC] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-[#0F172A]">
            Upload Patient Reports
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Upload PDF or text reports. MedLens AI will extract structured data,
            build a timeline, detect risk flags, and generate a clinical summary.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
              dragging
                ? "border-[#0EA5E9] bg-[#0EA5E9]/5"
                : "border-gray-200 bg-white hover:border-[#0EA5E9]/50 hover:bg-[#0EA5E9]/5"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0EA5E9]/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#0F172A]">
                  Drop files here or{" "}
                  <span className="text-[#0EA5E9]">browse</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Supports PDF and TXT — multiple files allowed
                </p>
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.txt"
              onChange={handleFilesSelected}
              className="hidden"
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </p>
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="text-xs text-gray-400 hover:text-red-500 transition"
                >
                  Clear all
                </button>
              </div>
              <ul className="divide-y divide-gray-50">
                {files.map((f) => (
                  <li key={f.name} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0EA5E9]/10 text-xs font-bold text-[#0EA5E9]">
                        {f.name.endsWith(".pdf") ? "PDF" : "TXT"}
                      </div>
                      <span className="truncate text-[#0F172A] max-w-xs">{f.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(f.name)}
                      className="ml-3 text-gray-300 hover:text-red-400 transition text-lg leading-none"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Processing failed</p>
              <p className="mt-1 break-words">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || files.length === 0}
            className="w-full rounded-xl bg-[#0EA5E9] py-3.5 font-semibold text-white shadow-lg shadow-[#0EA5E9]/25 transition hover:bg-[#0369A1] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Analysing..."
              : files.length
              ? `Analyse ${files.length} Report${files.length !== 1 ? "s" : ""} →`
              : "Select files to continue"}
          </button>
        </form>
      </div>
    </main>
  );
}