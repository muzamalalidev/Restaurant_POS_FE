// ----------------------------------------------------------------------

/**
 * OrderStatus enum values and labels
 */
export const ORDER_STATUS_OPTIONS = [
  { id: 1, label: 'Pending' },
  { id: 2, label: 'Confirmed' },
  { id: 3, label: 'In Progress' },
  { id: 4, label: 'Preparing' },
  { id: 5, label: 'Ready' },
  { id: 6, label: 'Ready For Pickup' },
  { id: 7, label: 'In Serving' },
  { id: 8, label: 'Served' },
  { id: 9, label: 'Out For Delivery' },
  { id: 10, label: 'Delivered' },
  { id: 11, label: 'Completed' },
  { id: 12, label: 'Cancelled' },
];

// ----------------------------------------------------------------------

/**
 * Get OrderStatus label by ID
 */
export const getOrderStatusLabel = (statusId) => {
  const status = ORDER_STATUS_OPTIONS.find((opt) => opt.id === statusId);
  return status?.label || `Unknown (${statusId})`;
};

// ----------------------------------------------------------------------

/**
 * Get OrderStatus color for badge
 * Returns MUI color variant based on status
 */
export const getOrderStatusColor = (statusId) => {
  const colorMap = {
    1: 'default', // Pending
    2: 'info', // Confirmed
    3: 'warning', // In Progress
    4: 'warning', // Preparing
    5: 'success', // Ready
    6: 'success', // Ready For Pickup
    7: 'info', // In Serving
    8: 'success', // Served
    9: 'info', // Out For Delivery
    10: 'success', // Delivered
    11: 'success', // Completed
    12: 'error', // Cancelled
  };
  return colorMap[statusId] || 'default';
};

// ----------------------------------------------------------------------

/**
 * Check if status is a completion status (frees table)
 */
export const isCompletionStatus = (statusId) => {
  return [11, 8, 10, 12].includes(statusId); // Completed, Served, Delivered, Cancelled
};

// ----------------------------------------------------------------------

/**
 * Check if status is an active status (reserves table)
 */
export const isActiveStatus = (statusId) => {
  return !isCompletionStatus(statusId);
};

