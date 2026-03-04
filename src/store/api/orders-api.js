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
    // Get all orders (branch/tenant from context; do not send branchId)
    getOrders: builder.query({
      query: (params) => {
        const { branchId: _b, ...rest } = params ?? {};
        return {
          url: '/api/orders',
          params: buildQueryParams({ includeItems: true, ...rest }),
        };
      },
      providesTags: ['Order'],
      transformResponse: normalizePaginatedResponse,
    }),

    // Get orders by order type (branch from context; do not send branchId)
    getOrdersByOrderType: builder.query({
      query: (params) => {
        const { branchId: _b, ...rest } = params ?? {};
        return {
          url: '/api/orders/by-order-type',
          params: buildQueryParams({ includeItems: true, ...rest }),
        };
      },
      providesTags: ['Order'],
      transformResponse: normalizePaginatedResponse,
    }),

    // Get take away orders (branch from context; do not send branchId)
    getTakeAwayOrders: builder.query({
      query: (params) => {
        const { branchId: _b, ...rest } = params ?? {};
        return {
          url: '/api/orders/takeaway',
          params: buildQueryParams({ includeItems: true, ...rest }),
        };
      },
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

