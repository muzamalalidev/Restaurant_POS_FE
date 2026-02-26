import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Order Types RTK Query API Slice
 *
 * OrderTypesController: enum-based dropdown only (no CRUD).
 * GET /api/ordertypes/dropdown returns fixed set: key = enum numeric value, value = name.
 */

export const orderTypesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrderTypesDropdown: builder.query({
      query: () => ({
        url: '/api/ordertypes/dropdown',
        method: 'GET',
      }),
      providesTags: ['OrderType'],
    }),
  }),
});

// ----------------------------------------------------------------------

export const { useGetOrderTypesDropdownQuery } = orderTypesApi;
