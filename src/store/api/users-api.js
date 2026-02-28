import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Users RTK Query API Slice
 * 
 * Handles all user operations.
 * Uses proper cache invalidation with tagTypes.
 * 
 * Note: Register endpoint returns raw GUID string (201 Created).
 * Toggle active and assign ownership return 204 No Content.
 */

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all users
    getUsers: builder.query({
      query: (params) => ({
        url: '/api/Users',
        params: {
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['User'],
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
      // API returns raw GUID string (201 Created), transform to object for consistency
      transformResponse: (response) => {
        // If response is a string (GUID), return as id
        if (typeof response === 'string') {
          return { id: response };
        }
        return response;
      },
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
  useToggleUserActiveMutation,
  useAssignTenantOwnershipMutation,
} = usersApi;

