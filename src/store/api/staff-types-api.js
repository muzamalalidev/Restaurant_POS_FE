import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Staff Types RTK Query API Slice
 * 
 * Handles all staff type operations.
 * Uses proper cache invalidation with tagTypes.
 */

export const staffTypesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all staff types
    getStaffTypes: builder.query({
      query: (params) => ({
        url: '/api/stafftypes',
        params: {
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['StaffType'],
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

    // Get staff type by ID (placeholder - only returns ID)
    getStaffTypeById: builder.query({
      query: (id) => ({
        url: `/api/stafftypes/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'StaffType', id }],
    }),

    // Create staff type
    createStaffType: builder.mutation({
      query: (data) => ({
        url: '/api/stafftypes',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['StaffType'],
    }),

    // Update staff type
    updateStaffType: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/stafftypes/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'StaffType', id },
        'StaffType',
      ],
    }),

    // Delete staff type (soft delete)
    deleteStaffType: builder.mutation({
      query: (id) => ({
        url: `/api/stafftypes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StaffType'],
    }),

    // Toggle staff type active status
    toggleStaffTypeActive: builder.mutation({
      query: (id) => ({
        url: `/api/stafftypes/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'StaffType', id },
        'StaffType',
      ],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetStaffTypesQuery,
  useGetStaffTypeByIdQuery,
  useCreateStaffTypeMutation,
  useUpdateStaffTypeMutation,
  useDeleteStaffTypeMutation,
  useToggleStaffTypeActiveMutation,
} = staffTypesApi;

