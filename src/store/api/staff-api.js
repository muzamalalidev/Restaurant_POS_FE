import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Staff RTK Query API Slice
 * 
 * Handles all staff operations.
 * Uses proper cache invalidation with tagTypes.
 */

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all staff
    getStaff: builder.query({
      query: (params) => ({
        url: '/api/staff',
        params: {
          branchId: params?.branchId || undefined,
          staffTypeId: params?.staffTypeId || undefined,
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['Staff'],
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

    // Get staff by ID (placeholder - only returns ID)
    getStaffById: builder.query({
      query: (id) => ({
        url: `/api/staff/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Staff', id }],
    }),

    // Create staff
    createStaff: builder.mutation({
      query: (data) => ({
        url: '/api/staff',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Staff'],
    }),

    // Update staff
    updateStaff: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/staff/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Staff', id },
        'Staff',
      ],
    }),

    // Delete staff (soft delete)
    deleteStaff: builder.mutation({
      query: (id) => ({
        url: `/api/staff/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Staff'],
    }),

    // Toggle staff active status
    toggleStaffActive: builder.mutation({
      query: (id) => ({
        url: `/api/staff/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Staff', id },
        'Staff',
      ],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetStaffQuery,
  useGetStaffByIdQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useToggleStaffActiveMutation,
} = staffApi;

