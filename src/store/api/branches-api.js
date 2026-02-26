import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Branches RTK Query API Slice
 * 
 * Handles all branch operations.
 * Uses proper cache invalidation with tagTypes.
 * Phone numbers are managed embedded within branch create/update operations.
 */

export const branchesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all branches
    getBranches: builder.query({
      query: (params) => ({
        url: '/api/branches',
        params: {
          tenantId: params?.tenantId || undefined,
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['Branch'],
      transformResponse: (response) => {
        // Handle both old format (array) and new format (PaginatedResponse)
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
        // Already in PaginatedResponse format
        return response;
      },
    }),

    // Get branch by ID
    getBranchById: builder.query({
      query: (id) => ({
        url: `/api/branches/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Branch', id }],
    }),

    // Create branch
    createBranch: builder.mutation({
      query: (data) => ({
        url: '/api/branches',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Branch'],
    }),

    // Update branch
    updateBranch: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/branches/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Branch', id },
        'Branch',
      ],
    }),

    // Delete branch (soft delete)
    deleteBranch: builder.mutation({
      query: (id) => ({
        url: `/api/branches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Branch'],
    }),

    // Toggle branch active status
    toggleBranchActive: builder.mutation({
      query: (id) => ({
        url: `/api/branches/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Branch', id },
        'Branch',
      ],
    }),

    getBranchesDropdown: builder.query({
      query: (params) => ({
        url: '/api/branches/dropdown',
        method: 'GET',
        params: {
          tenantId: params?.tenantId || undefined,
        },
      }),
      providesTags: ['Branch'],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetBranchesQuery,
  useGetBranchByIdQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  useToggleBranchActiveMutation,
  useGetBranchesDropdownQuery,
} = branchesApi;

