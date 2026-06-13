// ============================================================
// MedLens AI — File Text Extraction
// Direct port of extract_text_from_file() from backend/main.py
// Supports .pdf (via pdf-parse) and plain text files.
// ============================================================

/**
 * Extracts plain text from an uploaded file buffer.
 * - .pdf files are parsed page-by-page with pdf-parse.
 * - All other files are treated as UTF-8 text.
 */
export async function extractTextFromFile(
  filename: string,
  content: Buffer
): Promise<string> {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".pdf")) {
    // pdf-parse is a CommonJS module; dynamic import keeps it
    // out of the client bundle and works in Next's server runtime.
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(content);
    return data.text || "";
  }

  return content.toString("utf-8");
}
