// ----------------------------------------------------------------------

/**
 * Get active status label
 */
export const getActiveStatusLabel = (isActive) => {
  return isActive ? 'Active' : 'Inactive';
};

// ----------------------------------------------------------------------

/**
 * Get active status color for badge
 * Returns MUI color variant based on active status
 */
export const getActiveStatusColor = (isActive) => {
  return isActive ? 'success' : 'default';
};
