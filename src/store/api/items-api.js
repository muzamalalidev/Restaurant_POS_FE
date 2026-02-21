import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Items RTK Query API Slice
 * 
 * Handles all item operations.
 * Uses proper cache invalidation with tagTypes.
 */

export const itemsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all items
    getItems: builder.query({
      query: (params) => ({
        url: '/api/items',
        params: {
          categoryId: params?.categoryId || undefined,
          tenantId: params?.tenantId || undefined,
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['Item'],
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

    // Get item by ID (PLACEHOLDER - only returns ID, not used in implementation)
    getItemById: builder.query({
      query: (id) => ({
        url: `/api/items/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Item', id }],
    }),

    // Create item
    createItem: builder.mutation({
      query: (data) => ({
        url: '/api/items',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Item'],
    }),

    // Update item
    updateItem: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/items/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Item', id },
        'Item',
      ],
    }),

    // Delete item (soft delete)
    deleteItem: builder.mutation({
      query: (id) => ({
        url: `/api/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Item'],
    }),

    // Toggle item active status
    toggleItemActive: builder.mutation({
      query: (id) => ({
        url: `/api/items/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Item', id },
        'Item',
      ],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetItemsQuery,
  useGetItemByIdQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useToggleItemActiveMutation,
} = itemsApi;

