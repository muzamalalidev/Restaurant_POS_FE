import { baseApi } from 'src/store/api/base-api';

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
        params: {
          tenantId: params.tenantId,
          branchId: params.branchId,
          status: params.status || undefined,
          documentType: params.documentType || undefined,
          pageNumber: params.pageNumber || 1,
          pageSize: params.pageSize || 25,
          searchTerm: params.searchTerm || undefined,
        },
      }),
      providesTags: ['StockDocument'],
      transformResponse: (response) => {
        // Handle PaginatedResponse format
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
        return response;
      },
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

