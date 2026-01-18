import { PaginationParams, PaginationMeta } from '../types';

export class PaginationUtils {
  static DEFAULT_PAGE = 1;
  static DEFAULT_LIMIT = 10;
  static MAX_LIMIT = 100;

  // Parse and validate pagination params
  static parsePaginationParams(query: any): Required<PaginationParams> {
    const page = Math.max(1, parseInt(query.page) || this.DEFAULT_PAGE);
    const limit = Math.min(
      this.MAX_LIMIT,
      Math.max(1, parseInt(query.limit) || this.DEFAULT_LIMIT)
    );
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const search = query.search || '';

    return { page, limit, sortBy, sortOrder, search };
  }

  // Calculate skip value for Prisma
  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  // Create pagination metadata
  static createMeta(
    total: number,
    page: number,
    limit: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Create paginated response
  static createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ) {
    return {
      data,
      meta: this.createMeta(total, page, limit),
    };
  }
}