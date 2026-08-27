export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  requestId?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}
