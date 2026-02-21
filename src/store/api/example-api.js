import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * Example RTK Query API Slice
 * 
 * This is an example for NEW features.
 * Existing SWR hooks (useGetProducts, useGetPosts, etc.) remain unchanged.
 * 
 * Usage:
 * - Use RTK Query for all NEW API endpoints
 * - Keep existing SWR implementations as-is
 * - Both can coexist without conflicts
 */

export const exampleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Example: Get user notifications (NEW feature)
    getNotifications: builder.query({
      query: (params) => ({
        url: '/api/notifications',
        params,
      }),
      providesTags: ['Notification'],
    }),

    // Example: Create notification (NEW feature)
    createNotification: builder.mutation({
      query: (data) => ({
        url: '/api/notifications',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Notification'],
    }),

    // Example: Update notification (NEW feature)
    updateNotification: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/notifications/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Notification'],
    }),

    // Example: Delete notification (NEW feature)
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/api/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

// ----------------------------------------------------------------------

// Export hooks for usage in functional components
export const {
  useGetNotificationsQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useDeleteNotificationMutation,
} = exampleApi;

