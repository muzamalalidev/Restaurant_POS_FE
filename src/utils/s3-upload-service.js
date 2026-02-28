import { getApiErrorMessage } from 'src/utils/api-error-message';

import axiosInstance from 'src/lib/axios';

// ----------------------------------------------------------------------

/**
 * Uploads a file to S3 using a presigned URL (PUT request)
 * @param {File} file - File to upload
 * @param {string} presignedUrl - Presigned URL from getPresignedUrls
 * @param {string} contentType - Content type of the file
 * @param {Function} [onProgress] - Progress callback (percent: number) => void
 * @returns {Promise<void>}
 */
export async function uploadFileViaPresigned(file, presignedUrl, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `Upload failed with status ${xhr.status}: ${xhr.statusText || 'Unknown error'}`
          )
        );
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(file);
  });
}

/**
 * Uploads a file via direct upload endpoint (multipart form)
 * @param {File} file - File to upload
 * @param {Function} [onProgress] - Progress callback (percent: number) => void
 * @returns {Promise<{objectKey: string, downloadUrl: string | null, fileName: string, contentType: string}>}
 */
export async function uploadFileDirect(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const config = {
    // Don't set Content-Type - let browser set it with boundary automatically
    // Axios interceptor will handle removing any default Content-Type for FormData
    onUploadProgress: onProgress
      ? (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            onProgress(percent);
          }
        }
      : undefined,
  };

  try {
    const response = await axiosInstance.post('/api/s3-upload/upload', formData, config);
    return response.data;
  } catch (error) {
    const { message } = getApiErrorMessage(error, {
      defaultMessage: 'Upload failed',
      validationMessage: 'Invalid file. Please check file size and type.',
    });
    throw new Error(message);
  }
}

/**
 * Gets a presigned download URL for an existing object
 * @param {string} objectKey - S3 object key
 * @param {number} [expirySeconds=3600] - URL expiry in seconds
 * @returns {Promise<{downloadUrl: string, expiresInSeconds: number}>}
 */
export async function getPresignedDownloadUrl(objectKey, expirySeconds = 3600) {
  try {
    const response = await axiosInstance.get('/api/s3-upload/presigned-download', {
      params: {
        objectKey,
        expirySeconds,
      },
    });
    return response.data;
  } catch (error) {
    const { message } = getApiErrorMessage(error, {
      defaultMessage: 'Failed to get download URL',
      notFoundMessage: 'File not found',
    });
    throw new Error(message);
  }
}

/**
 * High-level upload function that chooses the best method
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @param {'presigned' | 'direct' | 'auto'} [options.mode='auto'] - Upload mode
 * @param {Function} [options.onProgress] - Progress callback
 * @param {Function} [options.getPresignedUrls] - Function to get presigned URLs (for presigned mode)
 * @returns {Promise<{objectKey: string, downloadUrl: string | null}>}
 */
export async function uploadFile(file, options = {}) {
  const { mode = 'auto', onProgress, getPresignedUrls } = options;

  // Auto mode: use direct upload (simpler, no presigned URL needed)
  if (mode === 'auto' || mode === 'direct') {
    const result = await uploadFileDirect(file, onProgress);
    return {
      objectKey: result.objectKey,
      downloadUrl: result.downloadUrl,
    };
  }

  // Presigned mode: get presigned URL, then upload
  if (mode === 'presigned' && getPresignedUrls) {
    const contentType = file.type || 'image/png';
    const fileName = file.name || 'file';

    // Get presigned URLs
    const presignedResponse = await getPresignedUrls({
      fileName,
      contentType,
    });

    if (!presignedResponse.uploadUrl) {
      throw new Error('Failed to get presigned upload URL');
    }

    // Upload to S3 using presigned URL
    await uploadFileViaPresigned(
      file,
      presignedResponse.uploadUrl,
      contentType,
      onProgress
    );

    return {
      objectKey: presignedResponse.objectKey,
      downloadUrl: presignedResponse.downloadUrl,
    };
  }

  throw new Error(`Invalid upload mode: ${mode}`);
}

