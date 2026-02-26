import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Payment Modes RTK Query API Slice
 *
 * All endpoints are tenant-scoped: /api/tenants/{tenantId}/payment-modes
 * Every call requires tenantId (from list filter or context).
 */

const buildBaseUrl = (tenantId) => `/api/tenants/${tenantId}/payment-modes`;

export const paymentModesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentModes: builder.query({
      query: ({ tenantId, pageNumber, pageSize, searchTerm }) => ({
        url: buildBaseUrl(tenantId),
        params: {
          pageNumber: pageNumber ?? undefined,
          pageSize: pageSize ?? undefined,
          searchTerm: searchTerm?.trim() || undefined,
        },
      }),
      providesTags: (result, error, { tenantId }) => [
        { type: 'PaymentMode', id: `LIST-${tenantId}` },
        'PaymentMode',
      ],
      transformResponse: (response) => {
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

    getPaymentModeById: builder.query({
      query: ({ tenantId, id }) => ({
        url: `${buildBaseUrl(tenantId)}/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, { id }) => [{ type: 'PaymentMode', id }],
    }),

    createPaymentMode: builder.mutation({
      query: ({ tenantId, body }) => ({
        url: buildBaseUrl(tenantId),
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PaymentMode'],
    }),

    updatePaymentMode: builder.mutation({
      query: ({ tenantId, id, body }) => ({
        url: `${buildBaseUrl(tenantId)}/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PaymentMode', id },
        'PaymentMode',
      ],
    }),

    deletePaymentMode: builder.mutation({
      query: ({ tenantId, id }) => ({
        url: `${buildBaseUrl(tenantId)}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PaymentMode'],
    }),

    togglePaymentModeActive: builder.mutation({
      query: ({ tenantId, id }) => ({
        url: `${buildBaseUrl(tenantId)}/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PaymentMode', id },
        'PaymentMode',
      ],
    }),

    getPaymentModesDropdown: builder.query({
      query: (tenantId) => ({
        url: `${buildBaseUrl(tenantId)}/dropdown`,
        method: 'GET',
      }),
      providesTags: (result, error, tenantId) => [
        { type: 'PaymentMode', id: `DROPDOWN-${tenantId}` },
        'PaymentMode',
      ],
    }),
  }),
});

// ----------------------------------------------------------------------

export const {
  useGetPaymentModesQuery,
  useGetPaymentModeByIdQuery,
  useCreatePaymentModeMutation,
  useUpdatePaymentModeMutation,
  useDeletePaymentModeMutation,
  useTogglePaymentModeActiveMutation,
  useGetPaymentModesDropdownQuery,
} = paymentModesApi;
