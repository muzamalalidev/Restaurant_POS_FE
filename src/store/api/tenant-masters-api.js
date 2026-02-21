import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Tenant Masters RTK Query API Slice
 *
 * Handles all tenant master operations.
 * P2-004: Platform-level entity (no tenant isolation).
 * Create returns 201 with raw Guid in response body.
 */

export const tenantMastersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTenantMasters: builder.query({
      query: (params) => ({
        url: '/api/tenantmasters',
        params: {
          ownerId: params?.ownerId || undefined,
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['TenantMaster'],
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

    getTenantMasterById: builder.query({
      query: (id) => ({
        url: `/api/tenantmasters/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'TenantMaster', id }],
    }),

    createTenantMaster: builder.mutation({
      query: (data) => ({
        url: '/api/tenantmasters',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['TenantMaster'],
    }),

    updateTenantMaster: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/tenantmasters/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'TenantMaster', id },
        'TenantMaster',
      ],
    }),

    deleteTenantMaster: builder.mutation({
      query: (id) => ({
        url: `/api/tenantmasters/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TenantMaster'],
    }),

    toggleTenantMasterActive: builder.mutation({
      query: (id) => ({
        url: `/api/tenantmasters/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'TenantMaster', id },
        'TenantMaster',
      ],
    }),

    getTenantMastersDropdown: builder.query({
      query: () => ({
        url: '/api/tenantmasters/dropdown',
        method: 'GET',
      }),
      providesTags: ['TenantMaster'],
    }),
  }),
});

// ----------------------------------------------------------------------

export const {
  useGetTenantMastersQuery,
  useGetTenantMasterByIdQuery,
  useCreateTenantMasterMutation,
  useUpdateTenantMasterMutation,
  useDeleteTenantMasterMutation,
  useToggleTenantMasterActiveMutation,
  useGetTenantMastersDropdownQuery,
} = tenantMastersApi;
