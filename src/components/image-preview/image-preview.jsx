'use client';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

import { getResolvedImageSrc } from 'src/utils/resolve-image-url';

import { useLazyGetPresignedDownloadUrlQuery } from 'src/store/api/s3-upload-api';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * Reusable S3 Image Preview Component
 *
 * Handles both S3 objectKeys and regular URLs:
 * - If imageUrl is an S3 objectKey (starts with "items/"), fetches presigned download URL
 * - If imageUrl is already a URL, uses it directly
 * - Shows loading skeleton while fetching
 * - Shows error placeholder if image fails to load
 * - Fully reusable across the application
 *
 * @param {Object} props
 * @param {string|null|undefined} props.imageUrl - S3 objectKey or image URL
 * @param {string} [props.alt] - Alt text for image (default: 'Image')
 * @param {string|number} [props.width] - Image width (default: '100%')
 * @param {string|number} [props.height] - Image height (default: 'auto')
 * @param {string} [props.ratio] - Aspect ratio (e.g., '16/9', '1/1')
 * @param {boolean} [props.showPlaceholder] - Show placeholder when no image (default: true)
 * @param {Object} [props.sx] - Additional MUI sx styles
 * @param {Object} [props.slotProps] - Slot props for customization
 * @param {Object} [props.slotProps.image] - Props for img element
 * @param {Object} [props.slotProps.skeleton] - Props for Skeleton component
 * @param {Object} [props.slotProps.placeholder] - Props for placeholder Box
 */
export function ImagePreview({
  imageUrl,
  alt = 'Image',
  width = '100%',
  height = 'auto',
  ratio,
  showPlaceholder = true,
  sx,
  slotProps,
  ...other
}) {
  const [displayUrl, setDisplayUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [previewUrls, setPreviewUrls] = useState({});
  const imageRef = useRef(null);

  const [getPresignedDownloadUrl] = useLazyGetPresignedDownloadUrlQuery();

  // Determine if imageUrl is an S3 objectKey
  const isS3ObjectKey = imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('items/');

  // Resolve display URL
  useEffect(() => {
    if (!imageUrl) {
      setDisplayUrl(null);
      setHasError(false);
      return;
    }

    // If it's already a full URL (presigned or regular), use it directly
    if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      setDisplayUrl(imageUrl);
      setHasError(false);
      return;
    }

    // If it's an S3 objectKey, check cache or fetch presigned URL
    if (isS3ObjectKey) {
      // Check cache first
      if (previewUrls[imageUrl]) {
        setDisplayUrl(previewUrls[imageUrl]);
        setHasError(false);
        return;
      }

      // Fetch presigned download URL
      setIsLoading(true);
      setHasError(false);
      getPresignedDownloadUrl({ objectKey: imageUrl })
        .unwrap()
        .then((response) => {
          if (response.downloadUrl) {
            setPreviewUrls((prev) => ({ ...prev, [imageUrl]: response.downloadUrl }));
            setDisplayUrl(response.downloadUrl);
          } else {
            setDisplayUrl(null);
            setHasError(true);
          }
        })
        .catch(() => {
          setDisplayUrl(null);
          setHasError(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Try to resolve as regular image URL
      const resolved = getResolvedImageSrc(imageUrl);
      setDisplayUrl(resolved);
      setHasError(!resolved);
    }
  }, [imageUrl, isS3ObjectKey, previewUrls, getPresignedDownloadUrl]);

  // Handle image load error
  const handleImageError = () => {
    setHasError(true);
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <Skeleton
        variant="rectangular"
        width={width}
        height={height}
        sx={[
          {
            ...(ratio && {
              aspectRatio: ratio,
              height: 'auto',
            }),
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...slotProps?.skeleton}
      />
    );
  }

  // Render placeholder when no image or error
  if (!displayUrl || hasError) {
    if (!showPlaceholder) return null;

    return (
      <Box
        sx={[
          {
            width,
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.neutral',
            borderRadius: 1,
            ...(ratio && {
              aspectRatio: ratio,
              height: 'auto',
            }),
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...slotProps?.placeholder}
        {...other}
      >
        <Iconify icon="solar:image-broken-bold" width={40} sx={{ color: 'text.disabled' }} />
      </Box>
    );
  }

  // Render image
  return (
    <Box
      component="img"
      ref={imageRef}
      src={displayUrl}
      alt={alt}
      onError={handleImageError}
      sx={[
        {
          width,
          height,
          objectFit: 'cover',
          borderRadius: 1,
          display: 'block',
          ...(ratio && {
            aspectRatio: ratio,
            height: 'auto',
          }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...slotProps?.image}
      {...other}
    />
  );
}

