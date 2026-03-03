import { baseApi } from 'src/store/api/base-api';
import { buildQueryParams, normalizePaginatedResponse } from 'src/store/api/build-query-params';

// ----------------------------------------------------------------------

/**
 * Payment Modes RTK Query API Slice
 *
 * Base route: api/PaymentModes (no tenantId in path).
 * Tenant is resolved from the current user context (JWT).
 */

const BASE_URL = '/api/PaymentModes';

export const paymentModesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentModes: builder.query({
      query: (params) => ({
        url: BASE_URL,
        params: buildQueryParams(params ?? {}),
      }),
      providesTags: (result, error) => ['PaymentMode'],
      transformResponse: normalizePaginatedResponse,
    }),

    getPaymentModeById: builder.query({
      query: (id) => ({
        url: `${BASE_URL}/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'PaymentMode', id }],
    }),

    createPaymentMode: builder.mutation({
      query: (body) => ({
        url: BASE_URL,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PaymentMode'],
    }),

    updatePaymentMode: builder.mutation({
      query: ({ id, body }) => ({
        url: `${BASE_URL}/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PaymentMode', id },
        'PaymentMode',
      ],
    }),

    deletePaymentMode: builder.mutation({
      query: (id) => ({
        url: `${BASE_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PaymentMode'],
    }),

    togglePaymentModeActive: builder.mutation({
      query: (id) => ({
        url: `${BASE_URL}/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'PaymentMode', id },
        'PaymentMode',
      ],
    }),

    getPaymentModesDropdown: builder.query({
      query: () => ({
        url: `${BASE_URL}/dropdown`,
        method: 'GET',
      }),
      providesTags: ['PaymentMode'],
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
