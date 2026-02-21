import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Recipes RTK Query API Slice
 * 
 * Handles all recipe operations.
 * Uses proper cache invalidation with tagTypes.
 * 
 * Note (P2-002): GetById endpoint is a placeholder (returns only { id }).
 * Form and details use getAllRecipes with pageSize 200 and client-side find by ID;
 * if total recipes > 200, the target recipe may not be in the response.
 */

export const recipesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all recipes
    getAllRecipes: builder.query({
      query: (params) => ({
        url: '/api/recipes',
        params: {
          pageNumber: params?.pageNumber || undefined,
          pageSize: params?.pageSize || undefined,
          searchTerm: params?.searchTerm || undefined,
        },
      }),
      providesTags: ['Recipe'],
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

    // Get recipe by ID (PLACEHOLDER - only returns { id }, not full recipe data)
    // Workaround: Use getAllRecipes with large pageSize and client-side filtering by ID
    getRecipeById: builder.query({
      query: (id) => ({
        url: `/api/recipes/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Recipe', id }],
    }),

    // Create recipe
    createRecipe: builder.mutation({
      query: (data) => ({
        url: '/api/recipes',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Recipe', 'Item'], // Item invalidated because recipe relationship changes
    }),

    // Update recipe
    updateRecipe: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/recipes/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Recipe', id },
        'Recipe',
      ],
    }),

    // Delete recipe (soft delete)
    deleteRecipe: builder.mutation({
      query: (id) => ({
        url: `/api/recipes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Recipe', 'Item'], // Item invalidated because recipe relationship changes
    }),

    // Toggle recipe active status
    toggleRecipeActive: builder.mutation({
      query: (id) => ({
        url: `/api/recipes/${id}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Recipe', id },
        'Recipe',
      ],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetAllRecipesQuery,
  useGetRecipeByIdQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
  useToggleRecipeActiveMutation,
} = recipesApi;

