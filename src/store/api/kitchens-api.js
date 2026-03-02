import { baseApi } from 'src/store/api/base-api';
import { buildQueryParams, normalizePaginatedResponse } from 'src/store/api/build-query-params';

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
        params: buildQueryParams(params ?? {}),
      }),
      providesTags: ['Kitchen'],
      transformResponse: normalizePaginatedResponse,
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

    getKitchensDropdown: builder.query({
      query: (params) => ({
        url: '/api/kitchens/dropdown',
        method: 'GET',
        params: buildQueryParams(params ?? {}),
      }),
      providesTags: ['Kitchen'],
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
  useGetKitchensDropdownQuery,
} = kitchensApi;

