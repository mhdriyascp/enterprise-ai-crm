// =============================================================================
// Text chunker for the RAG ingestion pipeline.
//
// Splits a document into overlapping, roughly fixed-size chunks while
// preferring to break on paragraph/sentence boundaries so chunks stay
// semantically coherent.
// =============================================================================

export interface ChunkOptions {
  chunkSize: number;
  overlap: number;
}

export function chunkText(text: string, options: ChunkOptions): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const { chunkSize } = options;
  const overlap = Math.min(options.overlap, Math.max(0, chunkSize - 1));

  // Break into candidate segments on blank lines / sentence boundaries.
  const segments = normalized
    .split(/\n\s*\n|(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  const flush = (): void => {
    if (current.trim()) chunks.push(current.trim());
  };

  for (const segment of segments) {
    // A single oversized segment is hard-split by size.
    if (segment.length > chunkSize) {
      flush();
      current = '';
      for (let i = 0; i < segment.length; i += chunkSize - overlap) {
        chunks.push(segment.slice(i, i + chunkSize).trim());
      }
      continue;
    }

    if (current.length + segment.length + 1 > chunkSize) {
      flush();
      // Carry over a tail of the previous chunk for context continuity.
      current = overlap > 0 ? `${tail(current, overlap)} ${segment}`.trim() : segment;
    } else {
      current = current ? `${current} ${segment}` : segment;
    }
  }
  flush();

  return chunks.filter(Boolean);
}

function tail(text: string, size: number): string {
  return text.length <= size ? text : text.slice(text.length - size);
}
