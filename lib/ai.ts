// ============================================================
// MedLens AI — AI Client
// Direct port of call_ai() from backend/main.py
// Tries a list of free OpenRouter models in order until one
// returns a usable response.
// ============================================================

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODELS_TO_TRY = [
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-r1:free",
];

/**
 * Calls OpenRouter's chat completions endpoint, trying each model in
 * MODELS_TO_TRY in order until one succeeds. Strips markdown code fences
 * (```json ... ```) from the response, mirroring the Python implementation.
 */
export async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not found in environment variables");
  }

  let lastError: unknown = null;

  for (const model of MODELS_TO_TRY) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "MedLens AI",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
        }),
        // OpenRouter free models can be slow
        signal: AbortSignal.timeout(30_000),
      });

      const result = await response.json();

      if (!result.choices) {
        lastError = result;
        continue;
      }

      let text: string = result.choices[0].message.content.trim();

      if (text.startsWith("```")) {
        text = text.replace(/^```/, "").replace(/```$/, "");
        if (text.startsWith("json")) {
          text = text.slice(4);
        }
      }

      return text.trim();
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw new Error(`All models failed: ${JSON.stringify(lastError)}`);
}

/**
 * Calls the AI and parses the response as JSON, retrying once on
 * JSON parse failure (mirrors the 2-attempt retry loop in /process).
 */
export async function callAIForJSON<T = unknown>(
  prompt: string,
  attempts = 2
): Promise<{ parsed: T | null; raw: string | null }> {
  let raw: string | null = null;

  for (let i = 0; i < attempts; i++) {
    raw = await callAI(prompt);
    try {
      const parsed = JSON.parse(raw) as T;
      return { parsed, raw };
    } catch {
      continue;
    }
  }

  return { parsed: null, raw };
}
