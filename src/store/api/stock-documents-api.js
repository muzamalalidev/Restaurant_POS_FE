import { baseApi } from 'src/store/api/base-api';
import { buildQueryParams, normalizePaginatedResponse } from 'src/store/api/build-query-params';

// ----------------------------------------------------------------------

/**
 * Stock Documents RTK Query API Slice
 * 
 * Handles all stock document operations.
 * Uses proper cache invalidation with tagTypes.
 * PostStockDocument also invalidates Stock and Item cache since StockBalance is updated.
 */

export const stockDocumentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all stock documents (paginated, requires tenantId + branchId)
    getAllStockDocuments: builder.query({
      query: (params) => ({
        url: '/api/stockdocuments',
        params: buildQueryParams(params ?? {}),
      }),
      providesTags: ['StockDocument'],
      transformResponse: normalizePaginatedResponse,
    }),

    // Get single stock document
    getStockDocument: builder.query({
      query: (id) => ({
        url: `/api/stockdocuments/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'StockDocument', id }],
    }),

    // Create stock document
    createStockDocument: builder.mutation({
      query: (data) => ({
        url: '/api/stockdocuments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['StockDocument'],
    }),

    // Update stock document
    updateStockDocument: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/stockdocuments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'StockDocument', id }],
    }),

    // Delete stock document
    deleteStockDocument: builder.mutation({
      query: (id) => ({
        url: `/api/stockdocuments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StockDocument'],
    }),

    // Post stock document
    postStockDocument: builder.mutation({
      query: (id) => ({
        url: `/api/stockdocuments/${id}/post`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'StockDocument', id },
        'Stock', // Also invalidate Stock cache (stock balance updated)
        'Item', // Also invalidate Item cache
      ],
    }),

    // Toggle active
    toggleStockDocumentActive: builder.mutation({
      query: (id) => ({
        url: `/api/stockdocuments/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'StockDocument', id }],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetAllStockDocumentsQuery,
  useGetStockDocumentQuery,
  useCreateStockDocumentMutation,
  useUpdateStockDocumentMutation,
  useDeleteStockDocumentMutation,
  usePostStockDocumentMutation,
  useToggleStockDocumentActiveMutation,
} = stockDocumentsApi;

