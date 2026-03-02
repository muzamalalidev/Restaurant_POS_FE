import { baseApi } from 'src/store/api/base-api';
import { buildQueryParams, normalizePaginatedResponse } from 'src/store/api/build-query-params';

// ----------------------------------------------------------------------

/**
 * Orders RTK Query API Slice
 * 
 * Handles all order operations.
 * Uses proper cache invalidation with tagTypes.
 */

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all orders
    getOrders: builder.query({
      query: (params) => ({
        url: '/api/orders',
        params: buildQueryParams({ includeItems: true, ...params }),
      }),
      providesTags: ['Order'],
      transformResponse: normalizePaginatedResponse,
    }),

    // Get orders by order type
    getOrdersByOrderType: builder.query({
      query: (params) => ({
        url: '/api/orders/by-order-type',
        params: buildQueryParams({ includeItems: true, ...params }),
      }),
      providesTags: ['Order'],
      transformResponse: normalizePaginatedResponse,
    }),

    // Get take away orders (convenience endpoint)
    getTakeAwayOrders: builder.query({
      query: (params) => ({
        url: '/api/orders/takeaway',
        params: buildQueryParams({ includeItems: true, ...params }),
      }),
      providesTags: ['Order'],
      transformResponse: normalizePaginatedResponse,
    }),

    // Get order by ID (fully implemented, not placeholder)
    getOrderById: builder.query({
      query: ({ id, includeItems = true }) => ({
        url: `/api/orders/${id}`,
        params: buildQueryParams({ includeItems: includeItems ?? true }),
      }),
      providesTags: (result, error, { id }) => [{ type: 'Order', id }],
    }),

    // Create order
    createOrder: builder.mutation({
      query: (data) => ({
        url: '/api/orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Order'],
    }),

    // Update order
    updateOrder: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        'Order',
      ],
    }),

    // Delete order (soft delete)
    deleteOrder: builder.mutation({
      query: (id) => ({
        url: `/api/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Order'],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetOrdersQuery,
  useGetOrdersByOrderTypeQuery,
  useGetTakeAwayOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} = ordersApi;

