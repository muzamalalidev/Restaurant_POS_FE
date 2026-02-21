import { baseApi } from 'src/store/api/base-api';

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
        params: {
          branchId: params?.branchId || undefined,
          staffId: params?.staffId || undefined,
          customerId: params?.customerId || undefined,
          status: params?.status || undefined,
          includeItems: params?.includeItems ?? true,
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['Order'],
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

    // Get orders by order type
    getOrdersByOrderType: builder.query({
      query: (params) => ({
        url: '/api/orders/by-order-type',
        params: {
          orderTypeId: params?.orderTypeId || undefined,
          orderTypeName: params?.orderTypeName || undefined,
          status: params?.status || undefined,
          branchId: params?.branchId || undefined,
          includeItems: params?.includeItems ?? true,
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['Order'],
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

    // Get take away orders (convenience endpoint)
    getTakeAwayOrders: builder.query({
      query: (params) => ({
        url: '/api/orders/takeaway',
        params: {
          status: params?.status || undefined,
          branchId: params?.branchId || undefined,
          includeItems: params?.includeItems ?? true,
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['Order'],
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

    // Get order by ID (fully implemented, not placeholder)
    getOrderById: builder.query({
      query: ({ id, includeItems = true }) => ({
        url: `/api/orders/${id}`,
        params: {
          includeItems,
        },
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

