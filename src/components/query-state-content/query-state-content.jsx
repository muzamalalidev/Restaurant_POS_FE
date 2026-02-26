'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const SKELETON_LINE_WIDTHS = ['40%', '90%', '60%', '85%', '70%', '55%'];

/**
 * Internal skeleton placeholder for dialog content loading.
 * Mimics label/value rows to reduce layout shift and set content expectations.
 */
function DialogContentSkeleton({ minHeight = 200, sx, ...other }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight,
        gap: 2,
        ...sx,
      }}
      {...other}
    >
      {SKELETON_LINE_WIDTHS.map((width, index) => (
        <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Skeleton variant="text" width={width} height={16} />
          <Skeleton variant="text" width={Math.min(100, 60 + index * 8)} height={20} />
        </Box>
      ))}
    </Box>
  );
}

// ----------------------------------------------------------------------

/**
 * QueryStateContent – single wrapper for dialog content loading, error, empty, and success.
 *
 * Handles:
 * - Loading: skeleton (default), spinner, or custom loadingNode
 * - Error: getApiErrorMessage + optional Retry button
 * - Empty: optional "no data" state
 * - Children: content when ready
 *
 * Caller passes one isLoading (can combine multiple APIs); wrapper is presentation only.
 *
 * @param {Object} props
 * @param {boolean} props.isLoading - Show loading UI
 * @param {boolean} props.isError - Show error UI
 * @param {unknown} props.error - Passed to getApiErrorMessage
 * @param {() => void} [props.onRetry] - If provided, error UI shows Retry button
 * @param {string} [props.loadingMessage] - e.g. "Loading..."; used for spinner variant
 * @param {'skeleton'|'spinner'} [props.loadingVariant='skeleton'] - Loader type
 * @param {React.ReactNode} [props.loadingNode] - Custom loader; overrides variant and message
 * @param {string} [props.errorTitle] - Error block title
 * @param {{ defaultMessage: string, notFoundMessage?: string, validationMessage?: string }} [props.errorMessageOptions] - For getApiErrorMessage
 * @param {boolean} [props.isEmpty] - When true (and not loading/error), show empty state
 * @param {string} [props.emptyMessage] - Message when isEmpty
 * @param {number} [props.minHeight=200] - Min height for loading/error/empty box
 * @param {React.ReactNode} props.children - Rendered when not loading, not error, not empty
 */
export function QueryStateContent({
  isLoading,
  isError,
  error,
  onRetry,
  loadingMessage,
  loadingVariant = 'skeleton',
  loadingNode,
  errorTitle,
  errorMessageOptions = {},
  isEmpty,
  emptyMessage,
  minHeight = 200,
  children,
}) {
  if (isLoading) {
    const boxSx = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight,
      gap: 2,
    };

    if (loadingNode) {
      return (
        <Box sx={boxSx}>
          {loadingNode}
        </Box>
      );
    }

    if (loadingVariant === 'spinner') {
      return (
        <Box sx={boxSx}>
          <CircularProgress />
          {loadingMessage && (
            <Typography variant="body2" color="text.secondary">
              {loadingMessage}
            </Typography>
          )}
        </Box>
      );
    }

    return (
      <DialogContentSkeleton minHeight={minHeight} />
    );
  }

  if (isError) {
    const { message } = getApiErrorMessage(error, errorMessageOptions);

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight,
          gap: 2,
        }}
      >
        <Typography variant="body1" color="error">
          {errorTitle || 'Something went wrong'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
        {onRetry && (
          <Field.Button
            variant="contained"
            onClick={onRetry}
            startIcon="solar:refresh-bold"
          >
            Retry
          </Field.Button>
        )}
      </Box>
    );
  }

  if (isEmpty) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {emptyMessage || 'No data'}
        </Typography>
      </Box>
    );
  }

  return children;
}
