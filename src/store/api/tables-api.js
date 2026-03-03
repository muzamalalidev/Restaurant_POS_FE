import { baseApi } from 'src/store/api/base-api';
import { buildQueryParams, normalizePaginatedResponse } from 'src/store/api/build-query-params';

// ----------------------------------------------------------------------

/**
 * Tables RTK Query API Slice
 *
 * Branch is resolved from the current user context (JWT).
 * GetAll does not take branchId; dropdown has no query parameters.
 */
export const tablesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all tables (pageNumber, pageSize, searchTerm only; branch from context)
    getAllTables: builder.query({
      query: (params) => {
        const { branchId: _b, ...rest } = params ?? {};
        return {
          url: '/api/tables',
          params: buildQueryParams(rest),
        };
      },
      providesTags: ['Table'],
      transformResponse: normalizePaginatedResponse,
    }),

    // Get table by ID (PLACEHOLDER - only returns { id }, not full table data)
    // Workaround: Use getAllTables with branchId filter and client-side filtering by ID
    getTableById: builder.query({
      query: (id) => ({
        url: `/api/tables/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Table', id }],
    }),

    // Create table
    createTable: builder.mutation({
      query: (data) => ({
        url: '/api/tables',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Table'],
    }),

    // Update table
    updateTable: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/tables/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Table', id },
        'Table',
      ],
    }),

    // Delete table (soft delete)
    deleteTable: builder.mutation({
      query: (id) => ({
        url: `/api/tables/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Table'],
    }),

    // Release table (sets IsAvailable = true)
    releaseTable: builder.mutation({
      query: (id) => ({
        url: `/api/tables/${id}/release`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Table', id },
        'Table',
      ],
    }),

    // Toggle table active status
    toggleTableActive: builder.mutation({
      query: (id) => ({
        url: `/api/tables/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Table', id },
        'Table',
      ],
    }),

    getTablesDropdown: builder.query({
      query: () => ({
        url: '/api/tables/dropdown',
        method: 'GET',
      }),
      providesTags: ['Table'],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetAllTablesQuery,
  useGetTableByIdQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
  useReleaseTableMutation,
  useToggleTableActiveMutation,
  useGetTablesDropdownQuery,
} = tablesApi;

