// =============================================================================
// Common Types
// =============================================================================

export type UUID = string;
export type ISODateString = string;

export interface BaseEntity {
  id: UUID;
  tenantId: UUID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  createdBy?: UUID;
  updatedBy?: UUID;
  deletedAt?: ISODateString;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  requestId?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp?: ISODateString;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: FieldError[];
  };
  meta?: ResponseMeta;
}

export interface FieldError {
  field: string;
  message: string;
}

export type SortOrder = 'asc' | 'desc';

export interface DateRange {
  from: ISODateString;
  to: ISODateString;
}
