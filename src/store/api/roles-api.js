import { baseApi } from 'src/store/api/base-api';
import { buildQueryParams, normalizePaginatedResponse } from 'src/store/api/build-query-params';

// ----------------------------------------------------------------------

/**
 * Roles RTK Query API Slice
 *
 * Handles all RolesController operations: list, get by id, create, update,
 * delete, toggle-active, permissions, scopes dropdown, roles dropdown,
 * assign/remove role to user, get user roles.
 * Create returns 201 with raw GUID in response body.
 */

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: (params) => ({
        url: '/api/roles',
        params: buildQueryParams(params ?? {}),
      }),
      providesTags: ['Role'],
      transformResponse: normalizePaginatedResponse,
    }),

    getRoleById: builder.query({
      query: (id) => ({
        url: `/api/roles/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => (id ? [{ type: 'Role', id }] : ['Role']),
    }),

    createRole: builder.mutation({
      query: (data) => ({
        url: '/api/roles',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Role'],
      transformResponse: (response) => {
        if (typeof response === 'string') {
          return { id: response };
        }
        return response;
      },
    }),

    updateRole: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/roles/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) =>
        id ? [{ type: 'Role', id }, 'Role'] : ['Role'],
    }),

    deleteRole: builder.mutation({
      query: (id) => ({
        url: `/api/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Role'],
    }),

    toggleRoleActive: builder.mutation({
      query: (id) => ({
        url: `/api/roles/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) =>
        id ? [{ type: 'Role', id }, 'Role'] : ['Role'],
    }),

    getPermissions: builder.query({
      query: () => ({
        url: '/api/roles/permissions',
        method: 'GET',
      }),
      providesTags: ['Role'],
    }),

    assignPermissionsToRole: builder.mutation({
      query: ({ id, permissionIds }) => ({
        url: `/api/roles/${id}/permissions`,
        method: 'POST',
        body: { permissionIds: permissionIds ?? [] },
      }),
      invalidatesTags: (result, error, { id }) =>
        id ? [{ type: 'Role', id }] : ['Role'],
    }),

    getRoleScopesDropdown: builder.query({
      query: () => ({
        url: '/api/roles/scopes-dropdown',
        method: 'GET',
      }),
      providesTags: ['Role'],
    }),

    getRolesDropdown: builder.query({
      query: (params) => ({
        url: '/api/roles/dropdown',
        params: buildQueryParams(params ?? {}),
      }),
      providesTags: ['Role'],
    }),

    assignRoleToUser: builder.mutation({
      query: (data) => ({
        url: '/api/roles/assign',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Role', 'User'],
    }),

    removeRoleFromUser: builder.mutation({
      query: (data) => ({
        url: '/api/roles/remove',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Role', 'User'],
    }),

    getUserRoles: builder.query({
      query: ({ userId, ...params }) => ({
        url: `/api/roles/user/${userId}`,
        params: buildQueryParams(params ?? {}),
      }),
      providesTags: (result, error, { userId }) =>
        userId ? [{ type: 'User', id: userId }, 'Role'] : ['Role'],
      transformResponse: normalizePaginatedResponse,
    }),
  }),
});

// ----------------------------------------------------------------------

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useToggleRoleActiveMutation,
  useGetPermissionsQuery,
  useAssignPermissionsToRoleMutation,
  useGetRoleScopesDropdownQuery,
  useGetRolesDropdownQuery,
  useAssignRoleToUserMutation,
  useRemoveRoleFromUserMutation,
  useGetUserRolesQuery,
} = rolesApi;
