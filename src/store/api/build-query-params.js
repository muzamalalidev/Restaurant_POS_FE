/**
 * Builds a query params object with only defined values (omits undefined, null, and empty string).
 * Used by RTK Query endpoints so only passed params are sent in the request.
 *
 * @param {Object} obj - Params object (can be undefined or null)
 * @returns {Object} New object with only keys where value is not undefined, null, or ''
 */
export function buildQueryParams(obj) {
  if (obj === undefined || obj === null) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

/**
 * Normalizes list API response to PaginatedResponse shape.
 * Handles both legacy array format and existing PaginatedResponse format.
 *
 * @param {Array|Object} response - API response (array or PaginatedResponse)
 * @returns {Object} PaginatedResponse shape
 */
export function normalizePaginatedResponse(response) {
  if (Array.isArray(response)) {
    return {
      data: response,
      pageNumber: 1,
      pageSize: response.length,
      totalCount: response.length,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }
  return response;
}
