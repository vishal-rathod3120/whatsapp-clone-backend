export interface PaginationParams {
    page?: number;
    limit?: number;
}
export interface PaginatedResult<T> {
    items: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export declare function calculatePagination(total: number, page?: number, limit?: number): PaginatedResult<unknown>['meta'];
