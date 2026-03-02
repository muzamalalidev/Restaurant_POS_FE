import { baseApi } from 'src/store/api/base-api';
import { buildQueryParams, normalizePaginatedResponse } from 'src/store/api/build-query-params';

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
      query: (params) => {
        const { tenantId, ...queryParams } = params ?? {};
        return {
          url: buildBaseUrl(tenantId),
          params: buildQueryParams(queryParams),
        };
      },
      providesTags: (result, error, params) => [
        { type: 'PaymentMode', id: `LIST-${params?.tenantId ?? ''}` },
        'PaymentMode',
      ],
      transformResponse: normalizePaginatedResponse,
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
