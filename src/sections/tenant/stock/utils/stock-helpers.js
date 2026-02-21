// ----------------------------------------------------------------------

/**
 * Low stock threshold (hardcoded in backend to 10)
 */
export const LOW_STOCK_THRESHOLD = 10;

// ----------------------------------------------------------------------

/**
 * Check if stock is low
 */
export const isLowStock = (stockQuantity) => {
  if (stockQuantity === null || stockQuantity === undefined) return false;
  return stockQuantity <= LOW_STOCK_THRESHOLD;
};

// ----------------------------------------------------------------------

/**
 * Get stock color for badge/indicator
 */
export const getStockColor = (stockQuantity) => {
  if (isLowStock(stockQuantity)) return 'error';
  return 'success';
};

// ----------------------------------------------------------------------

/**
 * Format stock quantity for display
 */
export const formatStockQuantity = (stockQuantity) => {
  if (stockQuantity === null || stockQuantity === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(stockQuantity);
};

// ----------------------------------------------------------------------

/**
 * Format stock quantity with currency (if needed)
 */
export const formatStockQuantityWithUnit = (stockQuantity, unit = '') => {
  const formatted = formatStockQuantity(stockQuantity);
  return unit ? `${formatted} ${unit}` : formatted;
};

