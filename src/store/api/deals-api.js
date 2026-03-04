import { baseApi } from 'src/store/api/base-api';
import { buildQueryParams, normalizePaginatedResponse } from 'src/store/api/build-query-params';

// ----------------------------------------------------------------------

/**
 * Deals RTK Query API Slice
 *
 * Tenant and branch are resolved from context; do not send in request body.
 */

export const dealsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDeals: builder.query({
      query: (params) => ({
        url: '/api/deals',
        params: buildQueryParams(params ?? {}),
      }),
      providesTags: ['Deal'],
      transformResponse: normalizePaginatedResponse,
    }),

    getDealById: builder.query({
      query: (arg) => {
        const id = typeof arg === 'object' && arg !== null ? arg.id : arg;
        const includeItems = typeof arg === 'object' && arg !== null ? arg.includeItems !== false : true;
        return {
          url: `/api/deals/${id}`,
          params: buildQueryParams({ includeItems }),
        };
      },
      providesTags: (result, error, arg) => {
        const id = typeof arg === 'object' && arg !== null ? arg.id : arg;
        return id ? [{ type: 'Deal', id }] : ['Deal'];
      },
    }),

    createDeal: builder.mutation({
      query: (data) => ({
        url: '/api/deals',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Deal'],
    }),

    updateDeal: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/deals/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Deal', id },
        'Deal',
      ],
    }),

    deleteDeal: builder.mutation({
      query: (id) => ({
        url: `/api/deals/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Deal'],
    }),

    toggleDealActive: builder.mutation({
      query: (id) => ({
        url: `/api/deals/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Deal', id },
        'Deal',
      ],
    }),
  }),
});

// ----------------------------------------------------------------------

export const {
  useGetDealsQuery,
  useGetDealByIdQuery,
  useCreateDealMutation,
  useUpdateDealMutation,
  useDeleteDealMutation,
  useToggleDealActiveMutation,
} = dealsApi;
