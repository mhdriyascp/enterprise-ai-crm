// =============================================================================
// Vector store abstraction. Tenants are isolated by collection name
// (`knowledge_{tenantId}`). The in-memory implementation keeps the platform
// runnable offline; the Qdrant implementation is used in real deployments.
// =============================================================================

export interface ChunkPayload {
  tenantId: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  text: string;
  [key: string]: unknown;
}

export interface VectorRecord {
  id: string;
  vector: number[];
  payload: ChunkPayload;
}

export interface SearchHit {
  id: string;
  score: number;
  payload: ChunkPayload;
}

export interface VectorStore {
  readonly name: string;
  /** Ensure a collection exists with the given vector size (idempotent). */
  ensureCollection(collection: string, dimensions: number): Promise<void>;
  upsert(collection: string, records: VectorRecord[]): Promise<void>;
  search(collection: string, vector: number[], limit: number): Promise<SearchHit[]>;
  deleteByDocument(collection: string, documentId: string): Promise<void>;
}

export function collectionForTenant(tenantId: string): string {
  return `knowledge_${tenantId.replace(/-/g, '')}`;
}
