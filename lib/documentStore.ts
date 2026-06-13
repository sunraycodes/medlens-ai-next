// ============================================================
// MedLens AI — Document Store (RAG retrieval)
//
// The Python backend uses ChromaDB + sentence-transformers for
// semantic retrieval. To keep this Next.js port dependency-light
// (no native/python vector DB), this module implements an
// equivalent in-memory store with TF-IDF + cosine similarity
// retrieval over the uploaded report texts.
//
// Behavior mirrors the original /process and /ask flow:
// - /process clears the store, then re-indexes every uploaded
//   document by filename.
// - /ask queries the store for the top-N most relevant documents
//   and returns their text + filenames as RAG context.
//
// NOTE: This store lives in server memory and resets on server
// restart (same lifecycle assumption as the in-memory ChromaDB
// client in the original backend).
// ============================================================

interface StoredDocument {
  filename: string;
  text: string;
  termFreq: Map<string, number>;
}

class DocumentStore {
  private documents: StoredDocument[] = [];
  private idf: Map<string, number> = new Map();

  /** Clears all stored documents (mirrors collection.delete on every /process call). */
  clear() {
    this.documents = [];
    this.idf.clear();
  }

  /** Adds a document and rebuilds IDF weights across the corpus. */
  add(filename: string, text: string) {
    const termFreq = tokenizeToTermFreq(text);
    this.documents.push({ filename, text, termFreq });
    this.rebuildIdf();
  }

  private rebuildIdf() {
    this.idf.clear();
    const n = this.documents.length;
    const docFreq = new Map<string, number>();

    for (const doc of this.documents) {
      for (const term of doc.termFreq.keys()) {
        docFreq.set(term, (docFreq.get(term) || 0) + 1);
      }
    }

    for (const [term, df] of docFreq.entries()) {
      this.idf.set(term, Math.log((1 + n) / (1 + df)) + 1);
    }
  }

  /**
   * Returns the top `nResults` documents most relevant to the query,
   * mirroring collection.query(query_texts=[question], n_results=3).
   */
  query(question: string, nResults = 3): StoredDocument[] {
    if (this.documents.length === 0) return [];

    const queryFreq = tokenizeToTermFreq(question);
    const queryVec = this.toVector(queryFreq);

    const scored = this.documents.map((doc) => ({
      doc,
      score: cosineSimilarity(queryVec, this.toVector(doc.termFreq)),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored
      .filter((s) => s.score > 0)
      .slice(0, nResults)
      .map((s) => s.doc);
  }

  private toVector(termFreq: Map<string, number>): Map<string, number> {
    const vec = new Map<string, number>();
    for (const [term, tf] of termFreq.entries()) {
      const idf = this.idf.get(term) || 0;
      vec.set(term, tf * idf);
    }
    return vec;
  }
}

function tokenizeToTermFreq(text: string): Map<string, number> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);

  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  return freq;
}

function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [term, valA] of a.entries()) {
    const valB = b.get(term) || 0;
    dot += valA * valB;
  }
  for (const val of a.values()) normA += val * val;
  for (const val of b.values()) normB += val * val;

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Singleton store, kept across hot-reloads in dev via globalThis
// (Next.js re-evaluates modules on every request in dev mode).
declare global {
  // eslint-disable-next-line no-var
  var __medlensDocumentStore: DocumentStore | undefined;
}

export function getDocumentStore(): DocumentStore {
  if (!globalThis.__medlensDocumentStore) {
    globalThis.__medlensDocumentStore = new DocumentStore();
  }
  return globalThis.__medlensDocumentStore;
}
