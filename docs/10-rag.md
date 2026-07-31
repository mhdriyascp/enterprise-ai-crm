# 10 — RAG (Retrieval-Augmented Generation)

## Overview

The RAG pipeline enables AI agents to answer questions grounded in company-specific knowledge, customer data, and documents. It supports hybrid search (vector + keyword) with citations.

---

## Pipeline Architecture

```
Document Input
      │
      ▼
┌─────────────┐
│  Ingestion   │  ← Files, URLs, API data
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Cleaning    │  ← Strip formatting, normalize text
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Chunking    │  ← Split into semantic chunks
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Metadata    │  ← Extract title, author, date, tags
│  Extraction  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Embeddings  │  ← text-embedding-3-large
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Storage    │  ← Qdrant (vectors) + OpenSearch (BM25)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Query      │
│  Processing  │  ← Query expansion, HyDE
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Hybrid     │  ← Vector search + BM25
│   Search     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Re-ranking  │  ← Cross-encoder model
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Generation  │  ← LLM with retrieved context
│ + Citations  │
└─────────────┘
```

---

## Document Ingestion

### Supported Sources

| Source | Format |
|---|---|
| File upload | PDF, DOCX, TXT, MD, HTML |
| URL crawl | Web pages |
| API | CRM data, support tickets |
| Email | Parsed email bodies |
| Google Drive | Documents, Sheets |
| Confluence | Wiki pages |

### Ingestion API

```http
POST /api/v1/knowledge/documents
Content-Type: multipart/form-data

file: <binary>
metadata: {"title": "...", "tags": ["..."], "visibility": "tenant"}
```

---

## Chunking Strategy

| Document Type | Strategy | Chunk Size | Overlap |
|---|---|---|---|
| Long-form text | Recursive character | 512 tokens | 50 tokens |
| Code | Language-aware | 256 tokens | 30 tokens |
| Tables | Row-based | N/A | N/A |
| Q&A pairs | Keep together | 256 tokens | 0 |

---

## Embedding Model

**Model:** `text-embedding-3-large` (OpenAI, 3072 dimensions)

For local development: `nomic-embed-text` (Ollama, 768 dimensions)

---

## Vector Storage (Qdrant)

```python
# Collection per tenant for isolation
collection_name = f"knowledge_{tenant_id}"

# Schema
{
  "id": "uuid",
  "vector": [0.1, 0.2, ...],  # 3072 dimensions
  "payload": {
    "text": "chunk content",
    "document_id": "uuid",
    "document_title": "string",
    "page_number": 3,
    "chunk_index": 7,
    "metadata": {},
    "tenant_id": "uuid",
    "created_at": "ISO 8601"
  }
}
```

---

## Hybrid Search

Combines:
1. **Semantic search** — Qdrant vector similarity (cosine)
2. **Keyword search** — OpenSearch BM25

Scores are fused using **Reciprocal Rank Fusion (RRF)**:

```python
rrf_score = sum(1 / (k + rank_i) for rank_i in ranks)
```

---

## Re-ranking

After retrieval, a cross-encoder model re-ranks the top-K results:

- **Model:** `cross-encoder/ms-marco-MiniLM-L-6-v2`
- **Input:** query + document pair
- **Output:** relevance score 0-1
- Top-5 documents are passed to the LLM

---

## Citations

Every RAG response includes source citations:

```json
{
  "answer": "According to the Q3 sales report...",
  "citations": [
    {
      "id": 1,
      "documentTitle": "Q3 Sales Report 2024",
      "documentId": "uuid",
      "chunkText": "...Q3 revenue grew 23% YoY...",
      "pageNumber": 4,
      "score": 0.92
    }
  ]
}
```

---

## Incremental Indexing

- New documents are indexed within 30 seconds of upload
- Document updates trigger re-chunking and re-embedding
- Deleted documents are removed from the index immediately
- Indexing jobs are processed by a Celery worker queue

---

## Query Processing

### Query Expansion

The user query is expanded to improve recall:

```python
# Original: "Q3 revenue"
# Expanded: ["Q3 revenue", "third quarter revenue", "Q3 sales results", ...]
```

### HyDE (Hypothetical Document Embeddings)

For sparse queries, a hypothetical answer is generated and embedded alongside the query for better retrieval.

---

## Access Control

- Documents have visibility levels: `public`, `tenant`, `private`
- Users only see documents they have permission to access
- Tenant data is always isolated in separate Qdrant collections

---

## Performance Targets

| Metric | Target |
|---|---|
| Indexing latency | < 30 seconds |
| Search latency (p99) | < 500ms |
| Re-ranking latency | < 100ms |
| End-to-end RAG latency | < 3 seconds |
| Index freshness | < 60 seconds |
