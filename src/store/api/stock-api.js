import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Stock RTK Query API Slice
 * 
 * Handles all stock operations.
 * Uses proper cache invalidation with tagTypes.
 * Also invalidates Item cache since stockQuantity is part of Item entity.
 */

export const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get stock for single item
    getStock: builder.query({
      query: (itemId) => ({
        url: `/api/stock/${itemId}`,
        method: 'GET',
      }),
      providesTags: (result, error, itemId) => [
        { type: 'Stock', id: itemId },
        { type: 'Item', id: itemId }, // Also provide Item cache tag
      ],
    }),

    // Check stock availability for multiple items
    checkStockAvailability: builder.mutation({
      query: (data) => ({
        url: '/api/stock/check-availability',
        method: 'POST',
        body: data,
      }),
      // Does not invalidate cache (read-only check)
    }),

    // Update stock (absolute value)
    updateStock: builder.mutation({
      query: ({ itemId, stockQuantity }) => ({
        url: `/api/stock/${itemId}`,
        method: 'PUT',
        body: { stockQuantity },
      }),
      invalidatesTags: (result, error, { itemId }) => [
        { type: 'Stock', id: itemId },
        { type: 'Item', id: itemId }, // Also invalidate Item cache
      ],
    }),

    // Adjust stock (relative value)
    adjustStock: builder.mutation({
      query: ({ itemId, adjustmentQuantity, reason }) => ({
        url: `/api/stock/${itemId}/adjust`,
        method: 'POST',
        body: { adjustmentQuantity, reason: reason || null },
      }),
      invalidatesTags: (result, error, { itemId }) => [
        { type: 'Stock', id: itemId },
        { type: 'Item', id: itemId }, // Also invalidate Item cache
      ],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetStockQuery,
  useCheckStockAvailabilityMutation,
  useUpdateStockMutation,
  useAdjustStockMutation,
} = stockApi;

