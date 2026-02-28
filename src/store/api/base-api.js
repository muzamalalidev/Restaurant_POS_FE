import { createApi } from '@reduxjs/toolkit/query/react';

import axiosInstance from 'src/lib/axios';

// ----------------------------------------------------------------------

/**
 * Custom base query using existing axios instance
 * This ensures consistency with SWR implementations
 * 
 * RTK Query uses 'body' in query objects, but axios uses 'data'
 * This function maps 'body' to 'data' for axios compatibility
 */
const axiosBaseQuery = async ({ url, method = 'GET', body, data, params, headers }) => {
  try {
    const token = typeof window !== 'undefined' 
      ? sessionStorage.getItem('accessToken') 
      : null;

    // Use 'body' from RTK Query or 'data' if provided
    const requestData = body !== undefined ? body : data;

    // Check if requestData is FormData - don't set Content-Type for FormData
    // Browser will set it automatically with boundary
    const isFormData = requestData instanceof FormData;

    // Build headers - explicitly delete Content-Type for FormData
    const requestHeaders = { ...headers };
    if (isFormData) {
      // Remove Content-Type so browser can set it with boundary
      delete requestHeaders['Content-Type'];
      delete requestHeaders['content-type'];
    } else {
      // Set Content-Type for non-FormData requests
      requestHeaders['Content-Type'] = 'application/json';
    }
    if (token) {
      requestHeaders.authorization = `Bearer ${token}`;
    }

    const result = await axiosInstance({
      url,
      method,
      data: requestData,
      params,
      headers: requestHeaders,
    });

    return { data: result.data };
  } catch (axiosError) {
    const error = {
      status: axiosError.response?.status,
      data: axiosError.response?.data || axiosError.message,
    };
    return { error };
  }
};

// ----------------------------------------------------------------------

/**
 * Base API for RTK Query
 * 
 * This uses the same axios instance as SWR for consistency.
 * All new API endpoints should use RTK Query.
 * 
 * Existing SWR implementations remain unchanged.
 */
const baseQuery = axiosBaseQuery;

// ----------------------------------------------------------------------

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    // Add tag types for cache invalidation
    'User',
    'Product',
    'Order',
    'Notification',
    'Tenant',
    'Branch',
    'StaffType',
    'Staff',
    'Category',
    'Item',
    'Stock',
    'StockDocument',
    'Table',
    'Recipe',
    'Kitchen',
    'TenantMaster',
    'PaymentMode',
    'OrderType',
    // Add more as needed for new features
  ],
  endpoints: () => ({}),
});

