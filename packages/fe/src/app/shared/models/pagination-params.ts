export interface PaginationParams {
  searchTerm?: string;
  page: number;
  limit?: number;
  total?: number;
  sortField?: string;
  sortDirection?: string;
}
