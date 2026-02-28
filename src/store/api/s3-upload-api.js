import { baseApi } from 'src/store/api/base-api';

// ----------------------------------------------------------------------

/**
 * S3 Upload RTK Query API Slice
 *
 * Handles all S3 upload operations:
 * - Get presigned URLs for upload/download
 * - Get presigned download URL for existing object
 * - Direct upload via multipart form
 */

export const s3UploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get presigned URLs for uploading and downloading a file
     * @param {Object} params - Query parameters
     * @param {string} params.fileName - File name (required)
     * @param {string} [params.contentType] - Content type (default: 'image/png')
     * @param {number} [params.expirySeconds] - URL expiry in seconds (default: 3600)
     */
    getPresignedUrls: builder.query({
      query: (params) => ({
        url: '/api/s3-upload/presigned',
        method: 'GET',
        params: {
          fileName: params.fileName,
          contentType: params.contentType || 'image/png',
          expirySeconds: params.expirySeconds || 3600,
        },
      }),
    }),

    /**
     * Get presigned download URL for an existing object
     * @param {Object} params - Query parameters
     * @param {string} params.objectKey - S3 object key (required)
     * @param {number} [params.expirySeconds] - URL expiry in seconds (default: 3600)
     */
    getPresignedDownloadUrl: builder.query({
      query: (params) => ({
        url: '/api/s3-upload/presigned-download',
        method: 'GET',
        params: {
          objectKey: params.objectKey,
          expirySeconds: params.expirySeconds || 3600,
        },
      }),
    }),

    /**
     * Direct upload file via multipart form
     * @param {FormData} formData - FormData with 'file' field
     */
    directUpload: builder.mutation({
      query: (formData) => ({
        url: '/api/s3-upload/upload',
        method: 'POST',
        body: formData,
        // Headers will be handled by base query (FormData detection)
      }),
    }),
  }),
});

// ----------------------------------------------------------------------

export const {
  useGetPresignedUrlsQuery,
  useLazyGetPresignedUrlsQuery,
  useGetPresignedDownloadUrlQuery,
  useLazyGetPresignedDownloadUrlQuery,
  useDirectUploadMutation,
} = s3UploadApi;

