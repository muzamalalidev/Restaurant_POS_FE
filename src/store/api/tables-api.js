import { baseApi } from 'src/store/api/base-api';
import { buildQueryParams, normalizePaginatedResponse } from 'src/store/api/build-query-params';

// ----------------------------------------------------------------------

/**
 * Tables RTK Query API Slice
 * 
 * Handles all table operations.
 * Uses proper cache invalidation with tagTypes.
 * 
 * Note: GetById endpoint is a placeholder (returns only { id }).
 * Use getAllTables with branchId filter and client-side filtering by ID as workaround.
 */

export const tablesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all tables
    getAllTables: builder.query({
      query: (params) => ({
        url: '/api/tables',
        params: buildQueryParams(params ?? {}),
      }),
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
      query: (params) => ({
        url: '/api/tables/dropdown',
        method: 'GET',
        params: buildQueryParams(params ?? {}),
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

