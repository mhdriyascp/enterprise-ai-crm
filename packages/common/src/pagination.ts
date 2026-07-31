import type { PaginatedResult, PaginationMeta, PaginationParams } from '@crm/types';

// =============================================================================
// Pagination Utilities
// =============================================================================

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export function normalizePagination(params: PaginationParams, maxLimit = 100): Required<Omit<PaginationParams, 'search' | 'sort' | 'order'>> & Pick<PaginationParams, 'search' | 'sort' | 'order'> {
  return {
    page: Math.max(1, params.page ?? 1),
    limit: Math.min(Math.max(1, params.limit ?? 20), maxLimit),
    sort: params.sort,
    order: params.order ?? 'desc',
    search: params.search,
  };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
  requestId?: string,
): PaginationMeta {
  return {
    total,
    page,
    limit,
    hasNext: page * limit < total,
    hasPrev: page > 1,
    requestId,
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  requestId?: string,
): PaginatedResult<T> {
  return {
    data,
    meta: buildPaginationMeta(total, page, limit, requestId),
  };
}

export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
