import { fNumber } from 'src/utils/format-number';

// ----------------------------------------------------------------------

/**
 * Default low stock threshold when not provided by API/record
 */
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

/**
 * Legacy constant (same as default)
 */
export const LOW_STOCK_THRESHOLD = DEFAULT_LOW_STOCK_THRESHOLD;

// ----------------------------------------------------------------------

/**
 * Check if stock is low
 * @param {number|null|undefined} stockQuantity
 * @param {number|null|undefined} [threshold] - Optional; defaults to DEFAULT_LOW_STOCK_THRESHOLD (10)
 */
export const isLowStock = (stockQuantity, threshold = DEFAULT_LOW_STOCK_THRESHOLD) => {
  if (stockQuantity === null || stockQuantity === undefined) return false;
  const t = threshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
  return Number(stockQuantity) <= Number(t);
};

// ----------------------------------------------------------------------

/**
 * Get stock color for badge/indicator
 * @param {number|null|undefined} stockQuantity
 * @param {number|null|undefined} [threshold] - Optional; defaults to DEFAULT_LOW_STOCK_THRESHOLD
 */
export const getStockColor = (stockQuantity, threshold = DEFAULT_LOW_STOCK_THRESHOLD) => {
  if (isLowStock(stockQuantity, threshold)) return 'error';
  return 'success';
};

// ----------------------------------------------------------------------

/**
 * Format stock quantity for display
 */
export const formatStockQuantity = (stockQuantity) =>
  stockQuantity == null ? '-' : fNumber(stockQuantity, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// ----------------------------------------------------------------------

/**
 * Format stock quantity with currency (if needed)
 */
export const formatStockQuantityWithUnit = (stockQuantity, unit = '') => {
  const formatted = formatStockQuantity(stockQuantity);
  return unit ? `${formatted} ${unit}` : formatted;
};

