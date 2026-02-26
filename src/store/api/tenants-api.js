import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Tenants RTK Query API Slice
 * 
 * Handles all tenant operations.
 * Uses proper cache invalidation with tagTypes.
 * Note: Phone numbers are managed embedded within tenant create/update operations.
 */

export const tenantsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all tenants
    getTenants: builder.query({
      query: (params) => ({
        url: '/api/tenants',
        params: {
          ownerId: params?.ownerId || undefined,
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['Tenant'],
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

    // Get tenant by ID
    getTenantById: builder.query({
      query: (id) => ({
        url: `/api/tenants/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Tenant', id }],
    }),

    // Create tenant
    createTenant: builder.mutation({
      query: (data) => ({
        url: '/api/tenants',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tenant'],
    }),

    // Update tenant
    updateTenant: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/tenants/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Tenant', id },
        'Tenant',
      ],
    }),

    // Delete tenant (soft delete)
    deleteTenant: builder.mutation({
      query: (id) => ({
        url: `/api/tenants/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tenant'],
    }),

    // Toggle tenant active status
    toggleTenantActive: builder.mutation({
      query: (id) => ({
        url: `/api/tenants/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Tenant', id },
        'Tenant',
      ],
    }),

    getTenantsDropdown: builder.query({
      query: () => ({
        url: '/api/tenants/dropdown',
        method: 'GET',
      }),
      providesTags: ['Tenant'],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetTenantsQuery,
  useGetTenantByIdQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
  useToggleTenantActiveMutation,
  useGetTenantsDropdownQuery,
} = tenantsApi;

