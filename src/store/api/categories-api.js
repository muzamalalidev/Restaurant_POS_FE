import { baseApi } from 'src/store/api/base-api';
import { buildQueryParams, normalizePaginatedResponse } from 'src/store/api/build-query-params';

// ----------------------------------------------------------------------

/**
 * Categories RTK Query API Slice
 * 
 * Handles all category operations.
 * Uses proper cache invalidation with tagTypes.
 */

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all categories (tenant from context; do not send tenantId)
    getCategories: builder.query({
      query: (params) => {
        const { tenantId: _t, ...rest } = params ?? {};
        return {
          url: '/api/categories',
          params: buildQueryParams(rest),
        };
      },
      providesTags: ['Category'],
      transformResponse: normalizePaginatedResponse,
    }),

    // Get category by ID (fully implemented, not placeholder)
    getCategoryById: builder.query({
      query: (id) => ({
        url: `/api/categories/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Category', id }],
    }),

    // Get child categories
    getChildCategories: builder.query({
      query: ({ parentId, ...params }) => ({
        url: `/api/categories/${parentId}/children`,
        params: buildQueryParams(params ?? {}),
      }),
      providesTags: ['Category'],
      transformResponse: normalizePaginatedResponse,
    }),

    // Create category
    createCategory: builder.mutation({
      query: (data) => ({
        url: '/api/categories',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Category'],
    }),

    // Update category
    updateCategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/categories/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Category', id },
        'Category',
      ],
    }),

    // Delete category (soft delete)
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/api/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),

    // Toggle category active status
    toggleCategoryActive: builder.mutation({
      query: (id) => ({
        url: `/api/categories/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Category', id },
        'Category',
      ],
    }),

    getCategoriesDropdown: builder.query({
      query: (params) => ({
        url: '/api/categories/dropdown',
        method: 'GET',
        params: buildQueryParams(params ?? {}),
      }),
      providesTags: ['Category'],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useGetChildCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useToggleCategoryActiveMutation,
  useGetCategoriesDropdownQuery,
} = categoriesApi;

