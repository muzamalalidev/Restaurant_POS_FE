/**
 * Generic API error message helper for RTK Query / API errors.
 * Use in list views (mutation catch), form dialogs (submit catch), and details dialogs (query error).
 *
 * @param {unknown} err - RTK Query / API error (from .unwrap() catch or query error)
 * @param {{ defaultMessage: string, notFoundMessage?: string, validationMessage?: string }} [options]
 * @returns {{ message: string, isRetryable: boolean }}
 */
export function getApiErrorMessage(err, options = {}) {
  const {
    defaultMessage = 'An error occurred',
    notFoundMessage,
    validationMessage,
  } = options;

  const networkMessage = 'Network error. Please check your connection.';
  const serverMessage = 'Server error. Please try again later.';

  // 1. Offline (SSR-safe)
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { message: networkMessage, isRetryable: true };
  }

  // 2. RTK no-response (FETCH_ERROR, TIMEOUT, PARSING_ERROR)
  const rtkNoResponse =
    !err?.data &&
    ['FETCH_ERROR', 'TIMEOUT', 'PARSING_ERROR'].includes(err?.status);
  if (rtkNoResponse) {
    return { message: networkMessage, isRetryable: true };
  }

  const status = err?.status ?? err?.data?.status;

  const dataMessage =
    err?.data?.message ??
    err?.data?.detail ??
    (typeof err?.data === 'string' ? err.data : null);

  // 3. 404
  if (status === 404) {
    return {
      message: dataMessage || notFoundMessage || defaultMessage,
      isRetryable: false,
    };
  }

  // 4. 400
  if (status === 400) {
    return {
      message:
        dataMessage || validationMessage || defaultMessage,
      isRetryable: false,
    };
  }

  // 5. 5xx
  if (typeof status === 'number' && status >= 500) {
    return { message: serverMessage, isRetryable: true };
  }

  // 6. Else
  return {
    message: dataMessage || defaultMessage,
    isRetryable: false,
  };
}
