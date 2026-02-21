import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Categories RTK Query API Slice
 * 
 * Handles all category operations.
 * Uses proper cache invalidation with tagTypes.
 */

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all categories
    getCategories: builder.query({
      query: (params) => ({
        url: '/api/categories',
        params: {
          tenantId: params?.tenantId || undefined,
          parentId: params?.parentId || undefined,
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['Category'],
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
        params: {
          tenantId: params?.tenantId || undefined,
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['Category'],
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
} = categoriesApi;

