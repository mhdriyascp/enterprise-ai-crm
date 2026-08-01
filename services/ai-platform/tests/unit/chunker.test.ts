import { describe, expect, it } from 'vitest';

import { chunkText } from '../../src/application/rag/chunker';

describe('chunkText', () => {
  it('returns an empty array for blank input', () => {
    expect(chunkText('', { chunkSize: 100, overlap: 10 })).toEqual([]);
    expect(chunkText('   ', { chunkSize: 100, overlap: 10 })).toEqual([]);
  });

  it('keeps short text as a single chunk', () => {
    const chunks = chunkText('A short sentence.', { chunkSize: 100, overlap: 10 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain('short sentence');
  });

  it('splits long text into multiple overlapping chunks', () => {
    const paragraph = Array.from({ length: 40 }, (_, i) => `Sentence number ${i}.`).join(' ');
    const chunks = chunkText(paragraph, { chunkSize: 120, overlap: 30 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic', () => {
    const text = 'First paragraph.\n\nSecond paragraph is a little longer than the first one.';
    const a = chunkText(text, { chunkSize: 40, overlap: 10 });
    const b = chunkText(text, { chunkSize: 40, overlap: 10 });
    expect(a).toEqual(b);
  });
});
