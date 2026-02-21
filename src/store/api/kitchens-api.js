import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Kitchens RTK Query API Slice
 * 
 * Handles all kitchen operations.
 * Uses proper cache invalidation with tagTypes.
 * 
 * Note: GetById endpoint is FULLY IMPLEMENTED (not a placeholder).
 * Can be used directly for fetching kitchen details.
 */

export const kitchensApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all kitchens
    getAllKitchens: builder.query({
      query: (params) => ({
        url: '/api/kitchens',
        params: {
          tenantId: params?.tenantId || undefined,
          branchId: params?.branchId || undefined,
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['Kitchen'],
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

    // Get kitchen by ID (FULL IMPLEMENTATION - not a placeholder)
    getKitchenById: builder.query({
      query: (id) => ({
        url: `/api/kitchens/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Kitchen', id }],
    }),

    // Create kitchen
    createKitchen: builder.mutation({
      query: (data) => ({
        url: '/api/kitchens',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Kitchen'],
    }),

    // Update kitchen
    updateKitchen: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/kitchens/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Kitchen', id },
        'Kitchen',
      ],
    }),

    // Delete kitchen (soft delete)
    deleteKitchen: builder.mutation({
      query: (id) => ({
        url: `/api/kitchens/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Kitchen'],
    }),

    // Toggle kitchen active status
    toggleKitchenActive: builder.mutation({
      query: (id) => ({
        url: `/api/kitchens/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Kitchen', id },
        'Kitchen',
      ],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetAllKitchensQuery,
  useGetKitchenByIdQuery,
  useCreateKitchenMutation,
  useUpdateKitchenMutation,
  useDeleteKitchenMutation,
  useToggleKitchenActiveMutation,
} = kitchensApi;

