export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function successResponse<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}

export function errorResponse(code: string, message: string, details?: unknown): ApiResponse {
  return {
    success: false,
    error: { code, message, details },
  };
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
