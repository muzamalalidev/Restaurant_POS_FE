import { baseApi } from 'src/store/api/base-api';
import { buildQueryParams, normalizePaginatedResponse } from 'src/store/api/build-query-params';

// ----------------------------------------------------------------------

/**
 * Users RTK Query API Slice
 *
 * Handles all user operations.
 * Register endpoints return raw GUID string (201 Created); transformed to { id }.
 */

function transformRegisterResponse(response) {
  if (typeof response === 'string') {
    return { id: response };
  }
  return response ?? {};
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all users
    getUsers: builder.query({
      query: (params) => ({
        url: '/api/Users',
        params: buildQueryParams(params ?? {}),
      }),
      providesTags: ['User'],
      transformResponse: normalizePaginatedResponse,
    }),

    // Get user by ID
    getUserById: builder.query({
      query: (id) => ({
        url: `/api/Users/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // Register user (create)
    registerUser: builder.mutation({
      query: (data) => ({
        url: '/api/Users/register',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
      transformResponse: transformRegisterResponse,
    }),

    registerTenantMasterUser: builder.mutation({
      query: (body) => ({
        url: '/api/Users/register/tenant-master',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
      transformResponse: transformRegisterResponse,
    }),

    registerTenantUser: builder.mutation({
      query: (body) => ({
        url: '/api/Users/register/tenant',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
      transformResponse: transformRegisterResponse,
    }),

    registerBranchUser: builder.mutation({
      query: (body) => ({
        url: '/api/Users/register/branch',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
      transformResponse: transformRegisterResponse,
    }),

    // Toggle user active status
    toggleUserActive: builder.mutation({
      query: (id) => ({
        url: `/api/Users/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        'User',
      ],
    }),

    // Assign tenant ownership
    assignTenantOwnership: builder.mutation({
      query: (data) => ({
        url: '/api/Users/assign-tenant-ownership',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tenant', 'User'],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useRegisterUserMutation,
  useRegisterTenantMasterUserMutation,
  useRegisterTenantUserMutation,
  useRegisterBranchUserMutation,
  useToggleUserActiveMutation,
  useAssignTenantOwnershipMutation,
} = usersApi;

