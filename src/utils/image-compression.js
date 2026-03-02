import imageCompression from 'browser-image-compression';

const DEFAULT_MAX_SIZE_KB = 40;
const DEFAULT_MAX_WIDTH_OR_HEIGHT = 1920;

/**
 * Returns true if the value is a File with an image MIME type.
 * Non-File values, Blobs, or files with non-image type (e.g. PDF, empty type) return false.
 *
 * @param {unknown} file - Value to check
 * @returns {boolean}
 */
export function isImageFile(file) {
  return file instanceof File && typeof file.type === 'string' && file.type.startsWith('image/');
}

/**
 * Compresses an image file to reduce size while preserving resolution.
 * Non-image files or invalid input are returned unchanged.
 * On compression failure, returns the original file so upload can still proceed.
 *
 * @param {File} file - File to compress (non-image files are returned as-is)
 * @param {object} [options] - Optional settings
 * @param {number} [options.maxSizeKB=40] - Target max size in KB
 * @param {number} [options.maxWidthOrHeight=1920] - Max dimension to preserve resolution
 * @param {boolean} [options.useWebWorker=true] - Use web worker (fallback to false on failure)
 * @returns {Promise<File>} - Compressed image or original file
 */
export async function compressImageFile(file, options = {}) {
  if (!file || !(file instanceof File)) {
    return Promise.resolve(file);
  }

  if (!isImageFile(file)) {
    return Promise.resolve(file);
  }

  const maxSizeKB = options.maxSizeKB ?? DEFAULT_MAX_SIZE_KB;
  const maxWidthOrHeight = options.maxWidthOrHeight ?? DEFAULT_MAX_WIDTH_OR_HEIGHT;
  const useWebWorker = options.useWebWorker !== false;

  const libraryOptions = {
    maxSizeMB: maxSizeKB / 1024,
    maxWidthOrHeight,
    useWebWorker,
  };

  try {
    const compressedBlob = await imageCompression(file, libraryOptions);
    const type = compressedBlob.type || file.type || 'image/jpeg';
    return new File([compressedBlob], file.name, { type, lastModified: Date.now() });
  } catch {
    if (useWebWorker) {
      try {
        const fallbackOptions = { ...libraryOptions, useWebWorker: false };
        const compressedBlob = await imageCompression(file, fallbackOptions);
        const type = compressedBlob.type || file.type || 'image/jpeg';
        return new File([compressedBlob], file.name, { type, lastModified: Date.now() });
      } catch {
        return file;
      }
    }
    return file;
  }
}
